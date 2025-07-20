
interface DemandBasedCalculationData {
  propertyId: string;
  raceId: string;
  checkInDate: string;
  checkOutDate: string;
}

export class PointsCalculationService {
  private static readonly BASE_POINTS = 100;
  private static readonly MIN_POINTS = 50;
  private static readonly MAX_POINTS = 500;

  /**
   * Calcula puntos dinámicamente usando la fórmula: points_cost = base × log(1 + open_requests / availability)
   */
  static async calculateDynamicPoints(data: DemandBasedCalculationData): Promise<number> {

    try {
      // Clean and validate inputs
      let cleanPropertyId = data.propertyId;
      if (cleanPropertyId.startsWith('property_')) {
        cleanPropertyId = cleanPropertyId.replace('property_', '');
      }
      
      // Validate that it's a proper UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cleanPropertyId)) {
        throw new Error('Invalid property ID format');
      }
      
      if (!uuidRegex.test(data.raceId)) {
        throw new Error('Invalid race ID format');
      }
      
      // Validate and format dates
      const checkInDate = new Date(data.checkInDate);
      const checkOutDate = new Date(data.checkOutDate);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      const formattedCheckIn = checkInDate.toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
      

      
      // Use database function for accurate calculation
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: result, error } = await supabase.rpc('calculate_dynamic_race_points', {
        p_race_id: data.raceId,
        p_property_id: cleanPropertyId,
        p_check_in_date: formattedCheckIn,
        p_check_out_date: formattedCheckOut
      });
      
      if (error) {
        throw error;
      }
      
      const calculatedPoints = result || this.BASE_POINTS;
      

      
      return calculatedPoints;
    } catch (error) {
      // Fallback a puntos base si hay error
      return this.BASE_POINTS;
    }
  }

  /**
   * Obtiene estadísticas de demanda para el cálculo dinámico
   */
  private static async getDemandStatistics(data: DemandBasedCalculationData): Promise<{
    openRequests: number;
    availability: number;
  }> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Clean and validate inputs
      let cleanPropertyId = data.propertyId;
      if (cleanPropertyId.startsWith('property_')) {
        cleanPropertyId = cleanPropertyId.replace('property_', '');
      }
      
      // Validate dates
      const checkInDate = new Date(data.checkInDate);
      const checkOutDate = new Date(data.checkOutDate);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.error('Invalid date format in getDemandStatistics:', { checkIn: data.checkInDate, checkOut: data.checkOutDate });
        throw new Error('Invalid date format');
      }
      
      const formattedCheckIn = checkInDate.toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
      
      // 1. Obtener solicitudes abiertas (pending) para fechas superpuestas en la zona
      const { data: race } = await supabase
        .from('races')
        .select('property_id, race_date')
        .eq('id', data.raceId)
        .single();
      
      if (!race) {
        throw new Error('Race not found');
      }
      
      // Obtener propiedades en la misma localidad
      const { data: targetProperty } = await supabase
        .from('properties')
        .select('locality')
        .eq('id', race.property_id)
        .single();
      
      if (!targetProperty) {
        throw new Error('Property not found');
      }
      
      // Buscar solicitudes pendientes en la misma zona y fechas superpuestas
      const { data: openBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in_date,
          check_out_date,
          property:properties!inner(locality)
        `)
        .eq('status', 'pending')
        .eq('property.locality', targetProperty.locality)
        .lte('check_in_date', formattedCheckOut)
        .gte('check_out_date', formattedCheckIn);
      
      const openRequests = openBookings?.length || 0;
      
      // 2. Obtener propiedades disponibles en la zona para las mismas fechas
      const { data: availableProperties } = await supabase
        .from('properties')
        .select(`
          id,
          locality,
          races!inner(id, race_date)
        `)
        .eq('locality', targetProperty.locality)
        .eq('is_active', true)
        .gte('races.race_date', formattedCheckIn)
        .lte('races.race_date', formattedCheckOut);
      
      const availability = availableProperties?.length || 1; // Mínimo 1 para evitar división por cero
      
      console.log('Real demand statistics:', {
        locality: targetProperty.locality,
        openRequests,
        availability,
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut
      });
      
      return {
        openRequests,
        availability
      };
    } catch (error) {
      console.error('Error fetching demand statistics:', error);
      
      // Fallback a valores simulados si hay error
      const mockOpenRequests = Math.floor(Math.random() * 20) + 5;
      const mockAvailability = Math.floor(Math.random() * 10) + 3;
      
      return {
        openRequests: mockOpenRequests,
        availability: mockAvailability
      };
    }
  }

  /**
   * Versión legacy del cálculo de puntos (mantener para compatibilidad)
   */
  static calculateRacePoints(raceData: {
    distance: string[];
    modalities: string[];
    raceDate: string;
    location: string;
    hostRating?: number;
    totalBookingsInArea?: number;
    totalRacesInArea?: number;
    totalBookingsForDistance?: number;
    totalRacesForDistance?: number;
  }): number {

    // Cálculo simplificado que aproxima la nueva fórmula
    const demandMultiplier = this.calculateDemandMultiplier(raceData);
    const seasonalMultiplier = this.calculateSeasonalMultiplier(raceData.raceDate);
    const distanceMultiplier = this.calculateDistanceMultiplier(raceData.distance);
    
    let finalPoints = this.BASE_POINTS * demandMultiplier * seasonalMultiplier * distanceMultiplier;
    
    // Aplicar límites
    finalPoints = Math.max(this.MIN_POINTS, Math.min(this.MAX_POINTS, Math.round(finalPoints)));
    
    console.log('Legacy calculated points:', finalPoints);
    return finalPoints;
  }

  /**
   * Calcula el multiplicador de demanda basado en oferta/demanda local
   */
  private static calculateDemandMultiplier(raceData: any): number {
    const { totalBookingsInArea = 0, totalRacesInArea = 1, totalBookingsForDistance = 0, totalRacesForDistance = 1 } = raceData;
    
    // Ratio de demanda por área geográfica
    const areaDemandRatio = totalBookingsInArea / totalRacesInArea;
    
    // Ratio de demanda por distancia
    const distanceDemandRatio = totalBookingsForDistance / totalRacesForDistance;
    
    // Combinar ambos ratios
    const combinedDemandRatio = (areaDemandRatio + distanceDemandRatio) / 2;
    
    // Convertir a multiplicador (alta demanda = más puntos)
    if (combinedDemandRatio > 2) return 1.5; // Muy alta demanda
    if (combinedDemandRatio > 1.5) return 1.3; // Alta demanda
    if (combinedDemandRatio > 1) return 1.1; // Demanda moderada
    if (combinedDemandRatio > 0.5) return 1.0; // Demanda normal
    return 0.8; // Baja demanda
  }

  /**
   * Calcula el multiplicador estacional
   */
  private static calculateSeasonalMultiplier(raceDate: string): number {
    const date = new Date(raceDate);
    const month = date.getMonth() + 1; // 1-12
    
    // Temporada alta de carreras (primavera y otoño)
    if (month >= 3 && month <= 5) return 1.2; // Primavera
    if (month >= 9 && month <= 11) return 1.3; // Otoño (temporada más popular)
    if (month >= 6 && month <= 8) return 0.9; // Verano (menos popular por calor)
    return 1.0; // Invierno (demanda normal)
  }

  /**
   * Calcula el multiplicador por distancia
   */
  private static calculateDistanceMultiplier(distances: string[]): number {
    if (!distances || distances.length === 0) return 1.0;
    
    // Distancias más populares tienen menor multiplicador (más oferta)
    // Distancias menos comunes tienen mayor multiplicador (menos oferta)
    const distanceMultipliers: { [key: string]: number } = {
      '5k': 0.8,        // Muy popular
      '10k': 0.9,       // Muy popular
      'half_marathon': 1.0, // Popular
      'marathon': 1.2,   // Menos común, más valorado
      'ultra': 1.5,      // Raro, muy valorado
      '15k': 1.1,        // Menos común
      '20k': 1.1         // Menos común
    };
    
    // Usar el multiplicador más alto si hay múltiples distancias
    const maxMultiplier = Math.max(...distances.map(d => distanceMultipliers[d] || 1.0));
    return maxMultiplier;
  }

  /**
   * Calcula el multiplicador por rating del host
   */
  private static calculateHostRatingMultiplier(hostRating?: number): number {
    if (!hostRating) return 1.0;
    
    // Hosts con mejor rating justifican más puntos
    if (hostRating >= 4.8) return 1.2;
    if (hostRating >= 4.5) return 1.1;
    if (hostRating >= 4.0) return 1.0;
    if (hostRating >= 3.5) return 0.9;
    return 0.8;
  }

  /**
   * Calcula el multiplicador por ubicación
   */
  private static calculateLocationMultiplier(location: string): number {
    const locationLower = location.toLowerCase();
    
    // Ciudades premium/turísticas
    const premiumCities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao'];
    const touristCities = ['san sebastian', 'granada', 'toledo', 'salamanca', 'santiago'];
    
    if (premiumCities.some(city => locationLower.includes(city))) {
      return 1.3; // Ciudades principales - más demanda
    }
    
    if (touristCities.some(city => locationLower.includes(city))) {
      return 1.2; // Ciudades turísticas
    }
    
    return 1.0; // Otras ubicaciones
  }
  
  /**
   * Interfaz pública para calcular puntos con verificación de disponibilidad en tiempo real
   */
  static async calculateBookingPoints(data: DemandBasedCalculationData): Promise<number> {
    // Primero verificar disponibilidad en tiempo real
    const isAvailable = await this.checkRealTimeAvailability(data);
    
    if (!isAvailable) {
      throw new Error('Las fechas seleccionadas ya no están disponibles');
    }
    
    // Calcular puntos dinámicos
    return this.calculateDynamicPoints(data);
  }
  
  /**
   * Verifica disponibilidad en tiempo real
   */
  private static async checkRealTimeAvailability(data: DemandBasedCalculationData): Promise<boolean> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Clean and validate property ID - remove any prefix if it exists
      let cleanPropertyId = data.propertyId;
      if (cleanPropertyId.startsWith('property_')) {
        cleanPropertyId = cleanPropertyId.replace('property_', '');
      }
      
      // Validate that it's a proper UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cleanPropertyId)) {
        console.error('Invalid property ID format:', cleanPropertyId);
        return false;
      }
      
      // Validate dates
      const checkInDate = new Date(data.checkInDate);
      const checkOutDate = new Date(data.checkOutDate);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.error('Invalid date format:', { checkIn: data.checkInDate, checkOut: data.checkOutDate });
        return false;
      }
      
      // Format dates properly for the database query
      const formattedCheckIn = checkInDate.toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
      
      console.log('Checking availability with:', {
        propertyId: cleanPropertyId,
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut
      });
      
      // ✅ FIXED: Proper overlap detection logic
      // Two bookings overlap if:
      // - New booking starts before existing booking ends AND
      // - New booking ends after existing booking starts
      // This translates to: existing.check_in_date < new.check_out_date AND existing.check_out_date > new.check_in_date
      
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('id, check_in_date, check_out_date, status')
        .eq('property_id', cleanPropertyId)
        .in('status', ['pending', 'accepted', 'confirmed']) // ✅ FIXED: Include pending bookings
        .lt('check_in_date', formattedCheckOut)  // ✅ FIXED: existing check-in < new check-out
        .gt('check_out_date', formattedCheckIn); // ✅ FIXED: existing check-out > new check-in
      
      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }
      
      const hasConflicts = conflicts && conflicts.length > 0;
      
      if (hasConflicts) {
        console.log('Found conflicting bookings:', conflicts);
        return false;
      }
      
      // ✅ ADDITIONAL CHECK: Verify property availability calendar for blocked dates
      const { data: blockedDates, error: availabilityError } = await supabase
        .from('property_availability')
        .select('date, status')
        .eq('property_id', cleanPropertyId)
        .gte('date', formattedCheckIn)
        .lte('date', formattedCheckOut)
        .eq('status', 'blocked');
      
      if (availabilityError) {
        console.error('Error checking property availability calendar:', availabilityError);
        // Don't fail the booking for calendar errors, just log
      }
      
      const hasBlockedDates = blockedDates && blockedDates.length > 0;
      
      if (hasBlockedDates) {
        console.log('Found blocked dates in availability calendar:', blockedDates);
        return false;
      }
      
      console.log('No conflicts found - dates are available');
      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Recalcula puntos para todas las carreras activas (función de mantenimiento)
   */
  static async recalculateAllRacePoints() {
    console.log('PointsCalculationService: Starting bulk points recalculation');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Obtener todas las carreras activas futuras
      const { data: races } = await supabase
        .from('races')
        .select(`
          id,
          property_id,
          race_date,
          points_cost
        `)
        .eq('is_active', true)
        .gte('race_date', new Date().toISOString().split('T')[0]);
      
      if (!races) {
        console.log('No active races found for recalculation');
        return;
      }
      
      let updatedCount = 0;
      
      for (const race of races) {
        try {
          // Calcular nuevos puntos dinámicos
          const newPoints = await this.calculateDynamicPoints({
            propertyId: race.property_id,
            raceId: race.id,
            checkInDate: race.race_date,
            checkOutDate: race.race_date // Para carreras, usar la misma fecha
          });
          
          // Actualizar solo si hay cambio significativo (>10%)
          const currentPoints = race.points_cost;
          const changePercentage = Math.abs(newPoints - currentPoints) / currentPoints;
          
          if (changePercentage > 0.1) {
            const { error } = await supabase
              .from('races')
              .update({ points_cost: newPoints })
              .eq('id', race.id);
            
            if (!error) {
              updatedCount++;
              console.log(`Updated race ${race.id}: ${currentPoints} -> ${newPoints} points`);
            }
          }
        } catch (error) {
          console.error(`Error updating race ${race.id}:`, error);
        }
      }
      
      console.log(`PointsCalculationService: Bulk recalculation completed. Updated ${updatedCount} races.`);
    } catch (error) {
      console.error('Error in bulk points recalculation:', error);
    }
  }
}

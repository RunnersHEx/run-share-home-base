import { supabase } from '@/integrations/supabase/client';

interface DemandBasedCalculationData {
  propertyId: string;
  raceId: string;
  checkInDate: string;
  checkOutDate: string;
}

interface ProvincialPointsData {
  raceId: string;
  checkInDate: string;
  checkOutDate: string;
}

export class PointsCalculationService {
  // Provincial point costs as per the requirements document
  private static readonly PROVINCIAL_POINTS: Record<string, number> = {
    'Álava': 20,
    'Albacete': 30,
    'Alicante': 30,
    'Almería': 30,
    'Asturias': 30,
    'Ávila': 20,
    'Badajoz': 20,
    'Barcelona': 60,
    'Burgos': 30,
    'Cáceres': 30,
    'Cádiz': 30,
    'Cantabria': 30,
    'Castellón': 40,
    'Ciudad Real': 20,
    'Córdoba': 30,
    'Cuenca': 20,
    'Girona': 30,
    'Granada': 30,
    'Guadalajara': 20,
    'Guipúzcoa': 20,
    'Huelva': 20,
    'Huesca': 20,
    'Illes Balears': 20,
    'Jaén': 20,
    'A Coruña': 30,
    'La Rioja': 20,
    'Las Palmas': 30,
    'León': 20,
    'Lleida': 20,
    'Lugo': 20,
    'Madrid': 60,
    'Málaga': 60,
    'Murcia': 40,
    'Navarra': 20,
    'Ourense': 20,
    'Palencia': 20,
    'Pontevedra': 30,
    'Salamanca': 30,
    'Santa Cruz de Tenerife': 30,
    'Segovia': 20,
    'Sevilla': 60,
    'Soria': 20,
    'Tarragona': 40,
    'Teruel': 20,
    'Toledo': 30,
    'Valencia': 60,
    'Valladolid': 20,
    'Vizcaya': 20,
    'Zamora': 20,
    'Zaragoza': 40,
    // Alternative spellings for compatibility
    'Gipuzkoa': 20,  // Alternative for Guipúzcoa
    'Baleares': 20    // Alternative for Illes Balears
  };

  /**
   * Calculate booking cost based on provincial points system
   * Primary method for race booking calculations
   */
  static async calculateProvincialBookingCost(data: ProvincialPointsData): Promise<number> {
    try {
      console.log('Calculating provincial booking cost:', data);

      // Validate dates
      const checkInDate = new Date(data.checkInDate);
      const checkOutDate = new Date(data.checkOutDate);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Calculate number of nights
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nights <= 0) {
        throw new Error('Invalid date range - check-out must be after check-in');
      }

      // Use database function for accurate calculation
      const { data: result, error } = await supabase.rpc('calculate_race_booking_cost', {
        p_race_id: data.raceId,
        p_check_in_date: data.checkInDate,
        p_check_out_date: data.checkOutDate
      });

      if (error) {
        console.error('Database calculation error:', error);
        // Fallback to manual calculation
        return this.fallbackProvincialCalculation(data.raceId, nights);
      }

      console.log('Provincial booking cost calculated:', result);
      return result || 0;
    } catch (error) {
      console.error('Error calculating provincial booking cost:', error);
      // Fallback calculation
      return this.fallbackProvincialCalculation(data.raceId, 1);
    }
  }

  /**
   * Fallback calculation when database function fails
   */
  private static async fallbackProvincialCalculation(raceId: string, nights: number): Promise<number> {
    try {
      // Get race province
      const { data: race, error } = await supabase
        .from('races')
        .select('province')
        .eq('id', raceId)
        .single();

      if (error || !race) {
        console.error('Error fetching race province:', error);
        return 100; // Default fallback
      }

      const pointsPerNight = this.PROVINCIAL_POINTS[race.province] || 30; // Default to 30 if province not found
      return nights * pointsPerNight;
    } catch (error) {
      console.error('Fallback calculation error:', error);
      return nights * 30; // Ultimate fallback
    }
  }

  /**
   * Award points for various actions as per the requirements document
   */
  static async awardActionPoints(action: string, userId: string, additionalData?: any): Promise<void> {
    try {
      let points = 0;
      let description = '';

      switch (action) {
        case 'add_property':
          points = 30;
          description = 'Added new property';
          break;
        case 'add_race':
          points = 40;
          description = 'Added new race';
          break;
        case 'identity_verification':
          points = 25;
          description = 'Identity verification completed';
          break;
        case 'new_subscriber':
          points = 30;
          description = 'New subscriber bonus';
          break;
        case 'subscription_renewal':
          points = 50;
          description = 'Annual subscription renewal';
          break;
        case 'five_star_review':
          points = 15;
          description = 'Received 5-star review';
          break;
        case 'hosting_complete':
          // This should be calculated based on nights
          const nights = additionalData?.nights || 1;
          points = nights * 40;
          description = `Hosting reward: ${nights} nights × 40 points`;
          break;
        default:
          console.error('Unknown action for point award:', action);
          return;
      }

      if (points > 0) {
        // Get current balance first
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('points_balance')
          .eq('id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching current balance:', fetchError);
          return;
        }

        const currentBalance = profile?.points_balance || 0;
        const newBalance = currentBalance + points;

        // Update user's points balance
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            points_balance: newBalance
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating points balance:', updateError);
          return;
        }

        // Record the transaction
        const { error: transactionError } = await supabase
          .from('points_transactions')
          .insert({
            user_id: userId,
            amount: points,
            type: 'subscription_bonus',
            description: description,
            booking_id: additionalData?.bookingId || null
          });

        if (transactionError) {
          console.error('Error recording points transaction:', transactionError);
        } else {
          console.log(`Awarded ${points} points to user ${userId} for ${action}`);
        }
      }
    } catch (error) {
      console.error('Error awarding action points:', error);
    }
  }

  /**
   * Deduct penalty points (for host cancellations)
   */
  static async deductPenaltyPoints(userId: string, points: number, reason: string, bookingId?: string): Promise<void> {
    try {
      // Get current balance first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current balance:', fetchError);
        return;
      }

      const currentBalance = profile?.points_balance || 0;
      const newBalance = currentBalance - points;

      // Update user's points balance (allow negative balance for penalties)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points_balance: newBalance
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deducting penalty points:', updateError);
        return;
      }

      // Record the penalty transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          amount: -points,
          type: 'booking_refund',
          description: `Penalty: ${reason}`,
          booking_id: bookingId || null
        });

      if (transactionError) {
        console.error('Error recording penalty transaction:', transactionError);
      } else {
        console.log(`Deducted ${points} penalty points from user ${userId} for ${reason}`);
      }
    } catch (error) {
      console.error('Error deducting penalty points:', error);
    }
  }

  /**
   * Process booking payment using provincial points system
   */
  static async processBookingPayment(bookingData: {
    bookingId: string;
    guestId: string;
    hostId: string;
    raceId: string;
    checkInDate: string;
    checkOutDate: string;
  }): Promise<number> {
    try {
      console.log('Processing booking payment:', bookingData);

      // Calculate cost using provincial system
      const cost = await this.calculateProvincialBookingCost({
        raceId: bookingData.raceId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate
      });

      // Use database function for secure transaction processing
      const { error } = await supabase.rpc('process_booking_with_provincial_points', {
        p_booking_id: bookingData.bookingId,
        p_guest_id: bookingData.guestId,
        p_host_id: bookingData.hostId,
        p_race_id: bookingData.raceId,
        p_check_in_date: bookingData.checkInDate,
        p_check_out_date: bookingData.checkOutDate
      });

      if (error) {
        console.error('Error processing booking payment:', error);
        throw error;
      }

      console.log(`Booking payment processed: ${cost} points`);
      return cost;
    } catch (error) {
      console.error('Error in processBookingPayment:', error);
      throw error;
    }
  }

  /**
   * Get user's points balance
   */
  static async getUserPointsBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user points balance:', error);
        return 0;
      }

      return data?.points_balance || 0;
    } catch (error) {
      console.error('Error getting user points balance:', error);
      return 0;
    }
  }

  /**
   * Get user's points transaction history
   */
  static async getUserPointsHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  /**
   * Check if user has sufficient points for a booking
   */
  static async checkSufficientPoints(userId: string, requiredPoints: number): Promise<boolean> {
    try {
      const balance = await this.getUserPointsBalance(userId);
      return balance >= requiredPoints;
    } catch (error) {
      console.error('Error checking sufficient points:', error);
      return false;
    }
  }

  /**
   * Get provincial points per night for a given province
   */
  static getProvincialPointsPerNight(province: string): number {
    return this.PROVINCIAL_POINTS[province] || 30; // Default to 30 if not found
  }

  /**
   * Get all provincial points mapping
   */
  static getAllProvincialPoints(): Record<string, number> {
    return { ...this.PROVINCIAL_POINTS };
  }

  /**
   * Recalculate all race points (background job)
   * This method is called by the background scheduler
   */
  static async recalculateAllRacePoints(): Promise<void> {
    try {
      console.log('Starting race points recalculation...');
      
      // Call the database function to refresh provincial point costs
      const { error: refreshError } = await supabase.rpc('check_expired_bookings');
      if (refreshError) {
        console.warn('Error during expired bookings check:', refreshError);
      }
      
      // Get all active races for validation
      const { data: races, error } = await supabase
        .from('races')
        .select('id, province, start_date, end_date, property_id')
        .gte('end_date', new Date().toISOString().split('T')[0]); // Only future/current races
      
      if (error) {
        console.error('Error fetching races for recalculation:', error);
        return;
      }
      
      if (!races || races.length === 0) {
        console.log('No active races found for recalculation');
        return;
      }
      
      console.log(`Validating points calculation for ${races.length} active races`);
      
      // Validate that each race has proper provincial point calculation
      let validationCount = 0;
      for (const race of races) {
        try {
          if (race.province) {
            // Test the provincial points calculation
            const testCost = await supabase.rpc('calculate_race_booking_cost', {
              p_race_id: race.id,
              p_check_in_date: race.start_date,
              p_check_out_date: race.end_date
            });
            
            if (!testCost.error) {
              validationCount++;
            }
          }
        } catch (validationError) {
          console.warn(`Validation failed for race ${race.id}:`, validationError);
        }
      }
      
      console.log(`Points calculation validated for ${validationCount}/${races.length} races`);
      console.log('Race points recalculation completed successfully');
    } catch (error) {
      console.error('Error in recalculateAllRacePoints:', error);
      throw error;
    }
  }

  // Legacy methods for backwards compatibility
  /**
   * @deprecated Use calculateProvincialBookingCost instead
   */
  static async calculateDynamicPoints(data: DemandBasedCalculationData): Promise<number> {
    console.warn('calculateDynamicPoints is deprecated. Use calculateProvincialBookingCost instead.');
    
    return this.calculateProvincialBookingCost({
      raceId: data.raceId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate
    });
  }

  /**
   * @deprecated Use calculateProvincialBookingCost instead
   */
  static async calculateBookingPoints(data: DemandBasedCalculationData): Promise<number> {
    console.warn('calculateBookingPoints is deprecated. Use calculateProvincialBookingCost instead.');
    
    // First verify availability
    const isAvailable = await this.checkRealTimeAvailability(data);
    
    if (!isAvailable) {
      throw new Error('Las fechas seleccionadas ya no están disponibles');
    }
    
    return this.calculateProvincialBookingCost({
      raceId: data.raceId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate
    });
  }

  /**
   * Verifica disponibilidad en tiempo real
   */
  private static async checkRealTimeAvailability(data: DemandBasedCalculationData): Promise<boolean> {
    try {
      // Clean and validate property ID
      let cleanPropertyId = data.propertyId;
      if (cleanPropertyId.startsWith('property_')) {
        cleanPropertyId = cleanPropertyId.replace('property_', '');
      }
      
      // Validate UUID format
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
      
      const formattedCheckIn = checkInDate.toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
      
      console.log('Checking availability with:', {
        propertyId: cleanPropertyId,
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut
      });
      
      // Check for conflicting bookings
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('id, check_in_date, check_out_date, status')
        .eq('property_id', cleanPropertyId)
        .in('status', ['pending', 'accepted', 'confirmed'])
        .lt('check_in_date', formattedCheckOut)
        .gt('check_out_date', formattedCheckIn);
      
      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }
      
      const hasConflicts = conflicts && conflicts.length > 0;
      
      if (hasConflicts) {
        console.log('Found conflicting bookings:', conflicts);
        return false;
      }
      
      // Check for blocked dates in availability calendar
      const { data: blockedDates, error: availabilityError } = await supabase
        .from('property_availability')
        .select('date, status')
        .eq('property_id', cleanPropertyId)
        .gte('date', formattedCheckIn)
        .lte('date', formattedCheckOut)
        .eq('status', 'blocked');
      
      if (availabilityError) {
        console.error('Error checking property availability calendar:', availabilityError);
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
}

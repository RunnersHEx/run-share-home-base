
interface RacePointsFactors {
  basePoints: number;
  demandMultiplier: number;
  seasonalMultiplier: number;
  distanceMultiplier: number;
  hostRatingMultiplier: number;
  locationMultiplier: number;
}

export class PointsCalculationService {
  private static readonly BASE_POINTS = 47; // Punto medio del rango 25-70
  private static readonly MIN_POINTS = 25;
  private static readonly MAX_POINTS = 70;

  /**
   * Calcula automáticamente los puntos para una carrera basado en oferta y demanda
   * Rango: 25-70 puntos por reserva y noche
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
    console.log('PointsCalculationService: Calculating points for race:', raceData);

    const factors: RacePointsFactors = {
      basePoints: this.BASE_POINTS,
      demandMultiplier: this.calculateDemandMultiplier(raceData),
      seasonalMultiplier: this.calculateSeasonalMultiplier(raceData.raceDate),
      distanceMultiplier: this.calculateDistanceMultiplier(raceData.distance),
      hostRatingMultiplier: this.calculateHostRatingMultiplier(raceData.hostRating),
      locationMultiplier: this.calculateLocationMultiplier(raceData.location)
    };

    console.log('Points calculation factors:', factors);

    // Cálculo final
    let finalPoints = factors.basePoints * 
                     factors.demandMultiplier * 
                     factors.seasonalMultiplier * 
                     factors.distanceMultiplier * 
                     factors.hostRatingMultiplier * 
                     factors.locationMultiplier;

    // Aplicar límites estrictos: 25-70 puntos
    finalPoints = Math.max(this.MIN_POINTS, Math.min(this.MAX_POINTS, Math.round(finalPoints)));

    console.log('Final calculated points:', finalPoints);
    return finalPoints;
  }

  /**
   * Calcula el multiplicador de demanda basado en oferta/demanda local
   * Mantiene el resultado dentro del rango 25-70
   */
  private static calculateDemandMultiplier(raceData: any): number {
    const { totalBookingsInArea = 0, totalRacesInArea = 1, totalBookingsForDistance = 0, totalRacesForDistance = 1 } = raceData;
    
    // Ratio de demanda por área geográfica
    const areaDemandRatio = totalBookingsInArea / totalRacesInArea;
    
    // Ratio de demanda por distancia
    const distanceDemandRatio = totalBookingsForDistance / totalRacesForDistance;
    
    // Combinar ambos ratios
    const combinedDemandRatio = (areaDemandRatio + distanceDemandRatio) / 2;
    
    // Multiplicadores más conservadores para mantener rango 25-70
    if (combinedDemandRatio > 2) return 1.3; // Muy alta demanda
    if (combinedDemandRatio > 1.5) return 1.2; // Alta demanda
    if (combinedDemandRatio > 1) return 1.1; // Demanda moderada
    if (combinedDemandRatio > 0.5) return 1.0; // Demanda normal
    return 0.9; // Baja demanda
  }

  /**
   * Calcula el multiplicador estacional (más conservador)
   */
  private static calculateSeasonalMultiplier(raceDate: string): number {
    const date = new Date(raceDate);
    const month = date.getMonth() + 1; // 1-12
    
    // Temporada alta de carreras (ajustado para rango 25-70)
    if (month >= 3 && month <= 5) return 1.1; // Primavera
    if (month >= 9 && month <= 11) return 1.15; // Otoño (temporada más popular)
    if (month >= 6 && month <= 8) return 0.95; // Verano 
    return 1.0; // Invierno
  }

  /**
   * Calcula el multiplicador por distancia (más conservador)
   */
  private static calculateDistanceMultiplier(distances: string[]): number {
    if (!distances || distances.length === 0) return 1.0;
    
    // Multiplicadores ajustados para rango 25-70
    const distanceMultipliers: { [key: string]: number } = {
      '5k': 0.9,        // Muy popular
      '10k': 0.95,      // Muy popular
      'half_marathon': 1.0, // Popular
      'marathon': 1.1,   // Menos común
      'ultra': 1.2,      // Raro
      '15k': 1.05,       // Menos común
      '20k': 1.05        // Menos común
    };
    
    // Usar el multiplicador más alto si hay múltiples distancias
    const maxMultiplier = Math.max(...distances.map(d => distanceMultipliers[d] || 1.0));
    return maxMultiplier;
  }

  /**
   * Calcula el multiplicador por rating del host (más conservador)
   */
  private static calculateHostRatingMultiplier(hostRating?: number): number {
    if (!hostRating) return 1.0;
    
    // Multiplicadores ajustados para rango 25-70
    if (hostRating >= 4.8) return 1.1;
    if (hostRating >= 4.5) return 1.05;
    if (hostRating >= 4.0) return 1.0;
    if (hostRating >= 3.5) return 0.95;
    return 0.9;
  }

  /**
   * Calcula el multiplicador por ubicación (más conservador)
   */
  private static calculateLocationMultiplier(location: string): number {
    const locationLower = location.toLowerCase();
    
    // Ciudades premium/turísticas (ajustado para rango 25-70)
    const premiumCities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao'];
    const touristCities = ['san sebastian', 'granada', 'toledo', 'salamanca', 'santiago'];
    
    if (premiumCities.some(city => locationLower.includes(city))) {
      return 1.15; // Ciudades principales
    }
    
    if (touristCities.some(city => locationLower.includes(city))) {
      return 1.1; // Ciudades turísticas
    }
    
    return 1.0; // Otras ubicaciones
  }

  /**
   * Recalcula puntos para todas las carreras activas (función de mantenimiento)
   */
  static async recalculateAllRacePoints() {
    console.log('PointsCalculationService: Starting bulk points recalculation');
    
    // Esta función se ejecutaría periódicamente (ej: cada noche)
    // para ajustar los puntos basado en la demanda real
    
    // TODO: Implementar lógica para:
    // 1. Obtener estadísticas actuales de demanda
    // 2. Recalcular puntos para todas las carreras
    // 3. Actualizar la base de datos
    
    console.log('PointsCalculationService: Bulk recalculation completed');
  }

  /**
   * Retorna el rango de puntos para mostrar en la UI
   */
  static getPointsRange(): { min: number; max: number } {
    return {
      min: this.MIN_POINTS,
      max: this.MAX_POINTS
    };
  }
}

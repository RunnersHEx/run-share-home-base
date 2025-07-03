
interface RacePointsFactors {
  basePoints: number;
  demandMultiplier: number;
  seasonalMultiplier: number;
  distanceMultiplier: number;
  hostRatingMultiplier: number;
  locationMultiplier: number;
}

export class PointsCalculationService {
  private static readonly BASE_POINTS = 100;
  private static readonly MIN_POINTS = 50;
  private static readonly MAX_POINTS = 500;

  /**
   * Calcula automáticamente los puntos para una carrera basado en oferta y demanda
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

    // Aplicar límites mínimos y máximos
    finalPoints = Math.max(this.MIN_POINTS, Math.min(this.MAX_POINTS, Math.round(finalPoints)));

    console.log('Final calculated points:', finalPoints);
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
}


import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFilters } from "@/types/race";

export class RaceDiscoveryService {
  static async fetchAllRaces(filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceDiscoveryService: Fetching all races with filters:', filters);
    
    try {
      // Primero obtener las carreras básicas
      let query = supabase
        .from('races')
        .select('*')
        .eq('is_active', true)
        .order('race_date', { ascending: true });

      // Apply filters
      if (filters?.month) {
        const year = new Date().getFullYear();
        const monthNum = parseInt(filters.month);
        const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
        console.log('Applying month filter:', filters.month, 'Date range:', startDate, 'to', endDate);
        query = query.gte('race_date', startDate).lte('race_date', endDate);
      }

      if (filters?.modalities && filters.modalities.length > 0) {
        console.log('Applying modalities filter:', filters.modalities);
        query = query.contains('modalities', filters.modalities);
      }

      if (filters?.distances && filters.distances.length > 0) {
        console.log('Applying distances filter:', filters.distances);
        query = query.contains('distances', filters.distances);
      }

      if (filters?.province) {
        console.log('Applying province filter:', filters.province);
        query = query.ilike('start_location', `%${filters.province}%`);
      }

      if (filters?.terrainProfiles && filters.terrainProfiles.length > 0) {
        console.log('Applying terrain profiles filter:', filters.terrainProfiles);
        query = query.contains('terrain_profile', filters.terrainProfiles);
      }

      const { data: raceData, error: raceError } = await query;

      if (raceError) {
        console.error('RaceDiscoveryService: Error fetching races:', raceError);
        throw raceError;
      }

      console.log('RaceDiscoveryService: Fetched races count:', raceData?.length || 0);

      if (!raceData || raceData.length === 0) {
        console.log('No races found in database');
        return [];
      }

      // Ahora enriquecer con datos de host y property por separado
      return await this.enrichRacesWithRelatedData(raceData);
    } catch (error) {
      console.error('RaceDiscoveryService: Error in fetchAllRaces:', error);
      throw error;
    }
  }

  private static async enrichRacesWithRelatedData(raceData: any[]): Promise<Race[]> {
    console.log('Enriching races with related data...');
    
    // Obtener todos los host_ids y property_ids únicos
    const hostIds = [...new Set(raceData.map(race => race.host_id).filter(Boolean))];
    const propertyIds = [...new Set(raceData.map(race => race.property_id).filter(Boolean))];

    console.log('Fetching data for hosts:', hostIds.length, 'properties:', propertyIds.length);

    // Obtener datos de hosts
    const { data: hostData, error: hostError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, verification_status, average_rating')
      .in('id', hostIds);

    if (hostError) {
      console.error('Error fetching host data:', hostError);
    }

    // Obtener datos de properties
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, locality, max_guests')
      .in('id', propertyIds);

    if (propertyError) {
      console.error('Error fetching property data:', propertyError);
    }

    // Crear mapas para búsqueda rápida
    const hostMap = new Map((hostData || []).map(host => [host.id, host]));
    const propertyMap = new Map((propertyData || []).map(property => [property.id, property]));

    // Enriquecer las carreras con los datos relacionados
    return raceData.map(race => {
      const hostInfo = hostMap.get(race.host_id);
      const propertyInfo = propertyMap.get(race.property_id);

      console.log(`Processing race: ${race.name}, Host: ${hostInfo?.first_name} ${hostInfo?.last_name}, Property: ${propertyInfo?.title}`);

      return {
        ...race,
        host_info: hostInfo || null,
        property_info: propertyInfo || null,
        modalities: Array.isArray(race.modalities) ? race.modalities : [],
        terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
        distances: Array.isArray(race.distances) ? race.distances : []
      };
    }) as Race[];
  }
}

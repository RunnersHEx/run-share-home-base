
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFilters } from "@/types/race";

export class RaceDiscoveryService {
  static async fetchAllRaces(filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceDiscoveryService: Fetching all races with filters:', filters);
    
    try {
      // Construir la consulta base con joins para obtener toda la información de una vez
      let query = supabase
        .from('races')
        .select(`
          *,
          host_info:profiles!races_host_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          ),
          property_info:properties!races_property_id_fkey(
            id,
            title,
            locality,
            max_guests
          )
        `)
        .eq('is_active', true)
        .order('race_date', { ascending: true });

      // Aplicar filtros
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

      // Transformar los datos para asegurar que tienen el formato correcto
      return raceData.map(race => ({
        ...race,
        modalities: Array.isArray(race.modalities) ? race.modalities : [],
        terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
        distances: Array.isArray(race.distances) ? race.distances : []
      })) as Race[];

    } catch (error) {
      console.error('RaceDiscoveryService: Error in fetchAllRaces:', error);
      throw error;
    }
  }
}


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
      const transformedRaces = raceData.map(race => {
        // Manejar host_info que puede venir como error o datos válidos
        let hostInfo = null;
        if (race.host_info && typeof race.host_info === 'object' && !('error' in race.host_info)) {
          hostInfo = race.host_info;
        }

        // Manejar property_info que puede venir como error o datos válidos  
        let propertyInfo = null;
        if (race.property_info && typeof race.property_info === 'object' && !('error' in race.property_info)) {
          propertyInfo = race.property_info;
        }

        return {
          id: race.id,
          host_id: race.host_id,
          property_id: race.property_id,
          name: race.name,
          description: race.description,
          race_date: race.race_date,
          registration_deadline: race.registration_deadline,
          modalities: Array.isArray(race.modalities) ? race.modalities : [],
          terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
          distances: Array.isArray(race.distances) ? race.distances : [],
          has_wave_starts: race.has_wave_starts,
          start_location: race.start_location,
          distance_from_property: race.distance_from_property,
          official_website: race.official_website,
          registration_cost: race.registration_cost,
          points_cost: race.points_cost,
          max_guests: race.max_guests,
          highlights: race.highlights,
          local_tips: race.local_tips,
          weather_notes: race.weather_notes,
          is_active: race.is_active,
          total_bookings: race.total_bookings,
          average_rating: race.average_rating,
          created_at: race.created_at,
          updated_at: race.updated_at,
          host_info: hostInfo,
          property_info: propertyInfo
        };
      });

      console.log('RaceDiscoveryService: Transformed races successfully:', transformedRaces.length);
      return transformedRaces as Race[];

    } catch (error) {
      console.error('RaceDiscoveryService: Error in fetchAllRaces:', error);
      throw error;
    }
  }
}

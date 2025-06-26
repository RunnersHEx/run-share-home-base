
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFilters } from "@/types/race";

export class RaceDiscoveryService {
  static async fetchAllRaces(filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceDiscoveryService: Fetching all races with filters:', filters);
    
    let query = supabase
      .from('races')
      .select(`
        *,
        profiles!races_host_id_fkey(
          first_name,
          last_name,
          profile_image_url,
          verification_status,
          average_rating
        ),
        properties!races_property_id_fkey(
          title,
          locality,
          max_guests
        )
      `)
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
      // Search in start_location
      query = query.ilike('start_location', `%${filters.province}%`);
    }

    if (filters?.terrainProfiles && filters.terrainProfiles.length > 0) {
      console.log('Applying terrain profiles filter:', filters.terrainProfiles);
      query = query.contains('terrain_profile', filters.terrainProfiles);
    }

    const { data: raceData, error: raceError } = await query;

    if (raceError) {
      console.error('RaceDiscoveryService: Error fetching all races:', raceError);
      throw raceError;
    }

    console.log('RaceDiscoveryService: Raw race data from database:', raceData?.length, 'races found');

    if (!raceData || raceData.length === 0) {
      console.log('No races found in database');
      return [];
    }

    return this.enrichRacesWithData(raceData);
  }

  private static enrichRacesWithData(raceData: any[]): Race[] {
    // Transform and enrich race data
    return raceData.map(race => {
      console.log(`Processing race: ${race.name}, Location: ${race.start_location}, Host: ${race.profiles?.first_name} ${race.profiles?.last_name}`);

      return {
        ...race,
        host_info: race.profiles,
        property_info: race.properties,
        modalities: Array.isArray(race.modalities) ? race.modalities : [],
        terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
        distances: Array.isArray(race.distances) ? race.distances : []
      };
    }) as Race[];
  }
}

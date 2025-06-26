
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFilters } from "@/types/race";

export class RaceDiscoveryService {
  static async fetchAllRaces(filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceDiscoveryService: Fetching all races with filters:', filters);
    
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
      query = query.overlaps('modalities', filters.modalities);
    }

    if (filters?.distances && filters.distances.length > 0) {
      console.log('Applying distances filter:', filters.distances);
      query = query.overlaps('distances', filters.distances);
    }

    if (filters?.province) {
      console.log('Applying province filter:', filters.province);
      query = query.ilike('start_location', `%${filters.province}%`);
    }

    if (filters?.terrainProfiles && filters.terrainProfiles.length > 0) {
      console.log('Applying terrain profiles filter:', filters.terrainProfiles);
      query = query.overlaps('terrain_profile', filters.terrainProfiles);
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

    return this.enrichRacesWithHostAndPropertyData(raceData);
  }

  private static async enrichRacesWithHostAndPropertyData(raceData: any[]): Promise<Race[]> {
    const hostIds = [...new Set(raceData.map(race => race.host_id))];
    const propertyIds = [...new Set(raceData.map(race => race.property_id))];

    console.log('Fetching host profiles for IDs:', hostIds);
    console.log('Fetching properties for IDs:', propertyIds);

    // Fetch host profiles
    const { data: hostProfiles, error: hostError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, verification_status, average_rating')
      .in('id', hostIds);

    if (hostError) {
      console.error('RaceDiscoveryService: Error fetching host profiles:', hostError);
    }

    // Fetch property data
    const { data: properties, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, locality, max_guests')
      .in('id', propertyIds);

    if (propertyError) {
      console.error('RaceDiscoveryService: Error fetching properties:', propertyError);
    }

    // Create lookup maps
    const hostMap = new Map(hostProfiles?.map(host => [host.id, host]) || []);
    const propertyMap = new Map(properties?.map(prop => [prop.id, prop]) || []);

    // Transform and enrich race data
    return raceData.map(race => {
      const hostProfile = hostMap.get(race.host_id);
      const property = propertyMap.get(race.property_id);

      console.log(`Processing race: ${race.name}, Location: ${race.start_location}, Host: ${hostProfile?.first_name} ${hostProfile?.last_name}`);

      return {
        ...race,
        modalities: Array.isArray(race.modalities) ? race.modalities : [],
        terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
        distances: Array.isArray(race.distances) ? race.distances : [],
        host_info: hostProfile ? {
          first_name: hostProfile.first_name,
          last_name: hostProfile.last_name,
          profile_image_url: hostProfile.profile_image_url,
          verification_status: hostProfile.verification_status,
          average_rating: hostProfile.average_rating || 4.5
        } : undefined,
        property_info: property ? {
          title: property.title,
          locality: property.locality,
          max_guests: property.max_guests
        } : undefined
      };
    }) as Race[];
  }
}

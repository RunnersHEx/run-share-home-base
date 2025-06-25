import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceFilters, RaceStats, RaceImage } from "@/types/race";

export class RaceService {
  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceService: Fetching races for host:', hostId);
    
    let query = supabase
      .from('races')
      .select(`
        *,
        properties(title, locality),
        profiles:host_id(first_name, last_name, profile_image_url, verification_status)
      `)
      .eq('host_id', hostId)
      .order('race_date', { ascending: false });

    if (filters?.month) {
      const year = new Date().getFullYear();
      const monthNum = parseInt(filters.month);
      const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
      query = query.gte('race_date', startDate).lte('race_date', endDate);
    }

    if (filters?.modality) {
      query = query.contains('modalities', [filters.modality]);
    }

    if (filters?.distance) {
      query = query.contains('distances', [filters.distance]);
    }

    if (filters?.status) {
      const isActive = filters.status === 'active';
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('RaceService: Error fetching races:', error);
      throw error;
    }

    console.log('RaceService: Raw data from database:', data);

    // Type cast the JSON fields to their proper types
    const processedRaces = (data || []).map(race => ({
      ...race,
      modalities: Array.isArray(race.modalities) ? race.modalities : [],
      terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
      distances: Array.isArray(race.distances) ? race.distances : []
    })) as Race[];

    console.log('RaceService: Processed races:', processedRaces);
    return processedRaces;
  }

  // New method to fetch ALL races for discovery (not just host's races)
  static async fetchAllRaces(filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceService: Fetching all races with filters:', filters);
    
    // Use separate queries to get race data and then join manually
    // This avoids the foreign key relationship issues
    let query = supabase
      .from('races')
      .select('*')
      .eq('is_active', true)
      .order('race_date', { ascending: true });

    if (filters?.month) {
      const year = new Date().getFullYear();
      const monthNum = parseInt(filters.month);
      const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
      query = query.gte('race_date', startDate).lte('race_date', endDate);
    }

    if (filters?.modalities && filters.modalities.length > 0) {
      // Use overlap operator for array matching
      query = query.overlaps('modalities', filters.modalities);
    }

    if (filters?.distances && filters.distances.length > 0) {
      query = query.overlaps('distances', filters.distances);
    }

    if (filters?.province) {
      query = query.ilike('start_location', `%${filters.province}%`);
    }

    const { data: raceData, error: raceError } = await query;

    if (raceError) {
      console.error('RaceService: Error fetching all races:', raceError);
      throw raceError;
    }

    console.log('RaceService: Raw race data from database:', raceData);

    if (!raceData || raceData.length === 0) {
      return [];
    }

    // Get unique host IDs and property IDs for separate queries
    const hostIds = [...new Set(raceData.map(race => race.host_id))];
    const propertyIds = [...new Set(raceData.map(race => race.property_id))];

    // Fetch host profiles
    const { data: hostProfiles, error: hostError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, verification_status, average_rating')
      .in('id', hostIds);

    if (hostError) {
      console.error('RaceService: Error fetching host profiles:', hostError);
    }

    // Fetch property data
    const { data: properties, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, locality, max_guests')
      .in('id', propertyIds);

    if (propertyError) {
      console.error('RaceService: Error fetching properties:', propertyError);
    }

    // Create lookup maps
    const hostMap = new Map(hostProfiles?.map(host => [host.id, host]) || []);
    const propertyMap = new Map(properties?.map(prop => [prop.id, prop]) || []);

    // Type cast the JSON fields to their proper types and add host/property info
    const processedRaces = raceData.map(race => {
      const hostProfile = hostMap.get(race.host_id);
      const property = propertyMap.get(race.property_id);

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

    console.log('RaceService: Processed all races:', processedRaces);
    return processedRaces;
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    console.log('RaceService: Creating race:', raceData, 'for host:', hostId);
    
    const { data, error } = await supabase
      .from('races')
      .insert({
        ...raceData,
        host_id: hostId
      })
      .select()
      .single();

    if (error) {
      console.error('RaceService: Error creating race:', error);
      throw error;
    }

    console.log('RaceService: Created race successfully:', data);

    // Type cast the JSON fields to their proper types
    return {
      ...data,
      modalities: Array.isArray(data.modalities) ? data.modalities : [],
      terrain_profile: Array.isArray(data.terrain_profile) ? data.terrain_profile : [],
      distances: Array.isArray(data.distances) ? data.distances : []
    } as Race;
  }

  static async updateRace(raceId: string, updates: Partial<RaceFormData>): Promise<void> {
    const { error } = await supabase
      .from('races')
      .update(updates)
      .eq('id', raceId);

    if (error) {
      throw error;
    }
  }

  static async deleteRace(raceId: string): Promise<void> {
    const { error } = await supabase
      .from('races')
      .delete()
      .eq('id', raceId);

    if (error) {
      throw error;
    }
  }

  static async getRaceStats(hostId: string): Promise<RaceStats> {
    const { data: races, error } = await supabase
      .from('races')
      .select('total_bookings, average_rating')
      .eq('host_id', hostId);

    if (error) {
      throw error;
    }

    const totalRaces = races?.length || 0;
    const bookingsThisYear = races?.reduce((sum, race) => sum + (race.total_bookings || 0), 0) || 0;
    const averageRating = races?.length ? 
      races.reduce((sum, race) => sum + (race.average_rating || 0), 0) / races.length : 0;

    return {
      totalRaces,
      bookingsThisYear,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }

  static async uploadRaceImage(raceId: string, file: File, category: string): Promise<RaceImage> {
    // Upload image to storage (implement based on your storage solution)
    const imageUrl = "placeholder-url"; // Replace with actual upload logic

    const { data, error } = await supabase
      .from('race_images')
      .insert({
        race_id: raceId,
        image_url: imageUrl,
        category: category as any,
        display_order: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      category: data.category as any
    } as RaceImage;
  }

  static async getRaceImages(raceId: string): Promise<RaceImage[]> {
    const { data, error } = await supabase
      .from('race_images')
      .select('*')
      .eq('race_id', raceId)
      .order('display_order');

    if (error) {
      throw error;
    }

    return (data || []).map(image => ({
      ...image,
      category: image.category as any
    })) as RaceImage[];
  }
}

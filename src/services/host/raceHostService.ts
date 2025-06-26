
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceFilters, RaceStats } from "@/types/race";

export class RaceHostService {
  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
    console.log('RaceHostService: Fetching races for host:', hostId);
    
    let query = supabase
      .from('races')
      .select('*')
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

    const { data: raceData, error: raceError } = await query;

    if (raceError) {
      console.error('RaceHostService: Error fetching races:', raceError);
      throw raceError;
    }

    if (!raceData || raceData.length === 0) {
      return [];
    }

    return this.enrichRacesWithHostAndPropertyData(raceData, hostId);
  }

  private static async enrichRacesWithHostAndPropertyData(raceData: any[], hostId: string): Promise<Race[]> {
    // Get host profile and property info separately to avoid join issues
    const { data: hostProfile, error: hostError } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_image_url, verification_status, average_rating')
      .eq('id', hostId)
      .single();

    if (hostError) {
      console.error('RaceHostService: Error fetching host profile:', hostError);
    }

    // Get property data for each race
    const propertyIds = [...new Set(raceData.map(race => race.property_id))];
    const { data: properties, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, locality, max_guests')
      .in('id', propertyIds);

    if (propertyError) {
      console.error('RaceHostService: Error fetching properties:', propertyError);
    }

    // Create property lookup map
    const propertyMap = new Map(properties?.map(prop => [prop.id, prop]) || []);

    // Type cast the JSON fields to their proper types and add host/property info
    return raceData.map(race => {
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
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    console.log('RaceHostService: Creating race:', raceData, 'for host:', hostId);
    
    const { data, error } = await supabase
      .from('races')
      .insert({
        ...raceData,
        host_id: hostId
      })
      .select()
      .single();

    if (error) {
      console.error('RaceHostService: Error creating race:', error);
      throw error;
    }

    console.log('RaceHostService: Created race successfully:', data);

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
}

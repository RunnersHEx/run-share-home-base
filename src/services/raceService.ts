
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceFilters, RaceStats, RaceImage } from "@/types/race";

export class RaceService {
  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
    let query = supabase
      .from('races')
      .select(`
        *,
        properties(title, locality)
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
      throw error;
    }

    // Type cast the JSON fields to their proper types
    return (data || []).map(race => ({
      ...race,
      modalities: Array.isArray(race.modalities) ? race.modalities : [],
      terrain_profile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
      distances: Array.isArray(race.distances) ? race.distances : []
    })) as Race[];
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    const { data, error } = await supabase
      .from('races')
      .insert({
        ...raceData,
        host_id: hostId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

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
      averageRating
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

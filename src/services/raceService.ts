
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceImage, RaceFilters } from "@/types/race";

export class RaceService {
  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
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

    if (filters?.status) {
      query = query.eq('is_active', filters.status === 'active');
    }

    const { data, error } = await query;
    if (error) throw error;

    let races = data || [];

    // Client-side filtering for JSONB fields
    if (filters?.modality) {
      races = races.filter(race => 
        race.modalities && race.modalities.includes(filters.modality)
      );
    }

    if (filters?.distance) {
      races = races.filter(race => 
        race.distances && race.distances.includes(filters.distance)
      );
    }

    return races;
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    const { data, error } = await supabase
      .from('races')
      .insert({
        ...raceData,
        host_id: hostId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRace(id: string, updates: Partial<RaceFormData>): Promise<void> {
    const { error } = await supabase
      .from('races')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteRace(id: string): Promise<void> {
    const { error } = await supabase
      .from('races')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async uploadRaceImage(
    raceId: string,
    file: File,
    category: string,
    caption?: string
  ): Promise<RaceImage> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${raceId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('race-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('race-images')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('race_images')
      .insert({
        race_id: raceId,
        image_url: publicUrl,
        category,
        caption,
        display_order: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async fetchRaceImages(raceId: string): Promise<RaceImage[]> {
    const { data, error } = await supabase
      .from('race_images')
      .select('*')
      .eq('race_id', raceId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getRaceStats(hostId: string): Promise<{
    totalRaces: number;
    bookingsThisYear: number;
    averageRating: number;
  }> {
    const { data: races, error } = await supabase
      .from('races')
      .select('total_bookings, average_rating')
      .eq('host_id', hostId);

    if (error) throw error;

    const totalRaces = races?.length || 0;
    const totalBookings = races?.reduce((sum, race) => sum + (race.total_bookings || 0), 0) || 0;
    const avgRating = races?.length > 0 
      ? races.reduce((sum, race) => sum + (race.average_rating || 0), 0) / races.length 
      : 0;

    return {
      totalRaces,
      bookingsThisYear: totalBookings,
      averageRating: Math.round(avgRating * 10) / 10
    };
  }
}

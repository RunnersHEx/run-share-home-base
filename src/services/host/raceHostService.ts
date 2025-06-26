
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceFilters, RaceStats } from "@/types/race";

export class RaceHostService {
  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
    try {
      console.log('RaceHostService: Fetching races for host:', hostId);
      
      let query = supabase
        .from('races')
        .select(`
          *,
          host_info:profiles!races_host_id_fkey(
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          ),
          property_info:properties!races_property_id_fkey(
            title,
            locality,
            max_guests
          )
        `)
        .eq('host_id', hostId)
        .eq('is_active', true)
        .order('race_date', { ascending: true });

      // Apply filters if provided
      if (filters?.status) {
        query = query.eq('is_active', filters.status === 'active');
      }
      
      if (filters?.modalities && filters.modalities.length > 0) {
        query = query.overlaps('modalities', filters.modalities);
      }
      
      if (filters?.distances && filters.distances.length > 0) {
        query = query.overlaps('distances', filters.distances);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching host races:', error);
        throw error;
      }

      console.log('RaceHostService: Retrieved races:', data);
      return data || [];
    } catch (error) {
      console.error('RaceHostService: Error in fetchHostRaces:', error);
      throw error;
    }
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    try {
      console.log('RaceHostService: Creating race:', raceData);
      
      const { data, error } = await supabase
        .from('races')
        .insert({
          ...raceData,
          host_id: hostId,
          is_active: true,
          total_bookings: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating race:', error);
        throw error;
      }

      console.log('RaceHostService: Created race:', data);
      return data;
    } catch (error) {
      console.error('RaceHostService: Error in createRace:', error);
      throw error;
    }
  }

  static async updateRace(raceId: string, updates: Partial<RaceFormData>): Promise<Race> {
    try {
      const { data, error } = await supabase
        .from('races')
        .update(updates)
        .eq('id', raceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating race:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('RaceHostService: Error in updateRace:', error);
      throw error;
    }
  }

  static async deleteRace(raceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);

      if (error) {
        console.error('Error deleting race:', error);
        throw error;
      }
    } catch (error) {
      console.error('RaceHostService: Error in deleteRace:', error);
      throw error;
    }
  }

  static async getRaceStats(hostId: string): Promise<RaceStats> {
    try {
      // Get total races count
      const { count: totalRaces } = await supabase
        .from('races')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', hostId)
        .eq('is_active', true);

      // Get bookings this year (placeholder - would need bookings table)
      const bookingsThisYear = 0;

      // Get average rating (placeholder - would need reviews table)
      const averageRating = 0;

      return {
        totalRaces: totalRaces || 0,
        bookingsThisYear,
        averageRating
      };
    } catch (error) {
      console.error('RaceHostService: Error in getRaceStats:', error);
      return {
        totalRaces: 0,
        bookingsThisYear: 0,
        averageRating: 0
      };
    }
  }
}

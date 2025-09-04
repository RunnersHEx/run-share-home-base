
import { supabase } from "@/integrations/supabase/client";
import { Race, RaceFormData, RaceFilters, RaceStats, RaceModality, TerrainProfile, RaceDistance } from "@/types/race";

export class RaceHostService {
  // Helper function to convert database race to typed Race
  private static convertDatabaseRaceToTyped(dbRace: any): Race {
    console.log('🔄 RaceHostService.convertDatabaseRaceToTyped: Starting conversion for race:', dbRace.id);
    
    // Safely parse JSON fields
    const parseJsonField = (field: any): any[] => {
      console.log('📋 RaceHostService.parseJsonField: Input field:', field, 'Type:', typeof field);
      
      if (Array.isArray(field)) {
        console.log('✅ RaceHostService.parseJsonField: Already an array:', field);
        return field;
      }
      
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          const result = Array.isArray(parsed) ? parsed : [];
          console.log('✅ RaceHostService.parseJsonField: Parsed string to:', result);
          return result;
        } catch {
          console.log('⚠️ RaceHostService.parseJsonField: Failed to parse string, returning empty array');
          return [];
        }
      }
      
      if (field && typeof field === 'object') {
        const result = Array.isArray(field) ? field : [];
        console.log('✅ RaceHostService.parseJsonField: Object converted to:', result);
        return result;
      }
      
      console.log('⚠️ RaceHostService.parseJsonField: Unknown type, returning empty array');
      return [];
    };

    const modalities = parseJsonField(dbRace.modalities) as RaceModality[];
    const terrain_profile = parseJsonField(dbRace.terrain_profile) as TerrainProfile[];
    const distances = parseJsonField(dbRace.distances) as RaceDistance[];
    
    console.log('✅ RaceHostService.convertDatabaseRaceToTyped: Final parsed values:');
    console.log('✅   - modalities:', modalities);
    console.log('✅   - terrain_profile:', terrain_profile);
    console.log('✅   - distances:', distances);
    console.log('✅   - max_guests:', dbRace.max_guests);
    console.log('✅   - race_date:', dbRace.race_date);

    const result = {
      ...dbRace,
      modalities,
      terrain_profile,
      distances
    };
    
    console.log('✅ RaceHostService.convertDatabaseRaceToTyped: Final converted race:', result);
    return result;
  }

  static async fetchHostRaces(hostId: string, filters?: RaceFilters): Promise<Race[]> {
    try {
      console.log('RaceHostService: Fetching races for host:', hostId);
      
      let query = supabase
        .from('races')
        .select(`
          *,
          property_info:properties!races_property_id_properties_fkey(
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
      
      // Convert database races to typed races
      const typedRaces = (data || []).map(race => RaceHostService.convertDatabaseRaceToTyped(race));
      console.log('RaceHostService: Converted races:', typedRaces);
      return typedRaces;
    } catch (error) {
      console.error('RaceHostService: Error in fetchHostRaces:', error);
      throw error;
    }
  }

  static async createRace(raceData: RaceFormData, hostId: string): Promise<Race> {
    try {
      console.log('RaceHostService: Creating race:', raceData);
      
      // Validate race date is in the future
      const raceDate = new Date(raceData.race_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (raceDate <= today) {
        throw new Error('La fecha de la carrera debe ser posterior a hoy');
      }
      
      // Remove points_cost from the data being sent - let the database trigger calculate it
      const { points_cost, ...raceDataWithoutPointsCost } = raceData;
      
      const { data, error } = await supabase
        .from('races')
        .insert({
          ...raceDataWithoutPointsCost,
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

      console.log('RaceHostService: Created race with auto-calculated points_cost:', data);
      return RaceHostService.convertDatabaseRaceToTyped(data);
    } catch (error) {
      console.error('RaceHostService: Error in createRace:', error);
      throw error;
    }
  }

  static async updateRace(raceId: string, updates: Partial<RaceFormData>): Promise<Race> {
    try {
      console.log('🔄 RaceHostService.updateRace: Starting update for race ID:', raceId);
      console.log('🔄 RaceHostService.updateRace: Updates to apply:', updates);
      
      // Validate race date is in the future if it's being updated
      if (updates.race_date) {
        const raceDate = new Date(updates.race_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (raceDate <= today) {
          throw new Error('La fecha de la carrera debe ser posterior a hoy');
        }
      }
      
      // Remove points_cost from updates - let the database trigger calculate it
      const { points_cost, ...updatesWithoutPointsCost } = updates;
      
      const { data, error } = await supabase
        .from('races')
        .update(updatesWithoutPointsCost)
        .eq('id', raceId)
        .select(`
          *,
          property_info:properties!races_property_id_properties_fkey(
            title,
            locality,
            max_guests
          )
        `)
        .single();

      if (error) {
        console.error('RaceHostService: Error updating race:', error);
        throw error;
      }

      console.log('✅ RaceHostService.updateRace: Raw data from database:', data);
      console.log('📋 RaceHostService.updateRace: Raw points_cost (auto-calculated):', data.points_cost);
      console.log('📋 RaceHostService.updateRace: Raw distances field:', data.distances);
      console.log('📋 RaceHostService.updateRace: Raw modalities field:', data.modalities);
      console.log('📋 RaceHostService.updateRace: Raw max_guests field:', data.max_guests);
      
      const convertedRace = RaceHostService.convertDatabaseRaceToTyped(data);
      console.log('✅ RaceHostService.updateRace: Converted race data:', convertedRace);
      console.log('🎯 RaceHostService.updateRace: Converted distances:', convertedRace.distances);
      console.log('🎯 RaceHostService.updateRace: Converted modalities:', convertedRace.modalities);
      console.log('🎯 RaceHostService.updateRace: Converted max_guests:', convertedRace.max_guests);
      console.log('🎯 RaceHostService.updateRace: Auto-calculated points_cost:', convertedRace.points_cost);
      
      return convertedRace;
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

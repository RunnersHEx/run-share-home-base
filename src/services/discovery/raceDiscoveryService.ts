import { supabase } from "@/integrations/supabase/client";
import { RaceFilters } from "@/types/race";

export class RaceDiscoveryService {
  static async fetchAllRaces(filters?: RaceFilters) {
    console.log('RaceDiscoveryService: Fetching races with filters:', filters);
    
    try {
      let query = supabase
        .from('races')
        .select(`
          *,
          host_info:profiles!races_host_id_profiles_fkey(
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          ),
          property_info:properties!races_property_id_properties_fkey(
            id,
            title,
            description,
            locality,
            provinces,
            full_address,
            bedrooms,
            beds,
            bathrooms,
            max_guests,
            amenities,
            house_rules,
            runner_instructions,
            images:property_images(id, image_url, caption, is_main, display_order)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply simple filters that work with Supabase
      if (filters) {
        // Province filter - check race province directly
        if (filters.province) {
          console.log('Applying province filter:', filters.province);
          query = query.eq('province', filters.province);
        }

        // Month filter
        if (filters.month) {
          console.log('Applying month filter:', filters.month);
          const monthInt = parseInt(filters.month);
          const currentYear = new Date().getFullYear();
          
          // Handle year rollover for December
          let endYear = currentYear;
          let endMonth = monthInt + 1;
          
          if (endMonth > 12) {
            endMonth = 1;
            endYear = currentYear + 1;
          }
          
          const startDate = `${currentYear}-${monthInt.toString().padStart(2, '0')}-01`;
          const endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01`;
          
          query = query.filter('race_date', 'gte', startDate)
                       .filter('race_date', 'lt', endDate);
        }

        // Max guests filter
        if (filters.maxGuests) {
          console.log('Applying max guests filter:', filters.maxGuests);
          query = query.gte('max_guests', filters.maxGuests);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('RaceDiscoveryService: Error fetching races:', error);
        throw error;
      }

      let races = data || [];
      
      // Apply JSONB filters client-side to avoid Supabase issues
      if (filters) {
        // Modality filter
        if (filters.modalities && filters.modalities.length > 0) {
          console.log('Applying modality filter client-side:', filters.modalities);
          races = races.filter(race => {
            const raceModalities = race.modalities || [];
            return filters.modalities.some(modality => raceModalities.includes(modality));
          });
        }

        // Distance filter
        if (filters.distances && filters.distances.length > 0) {
          console.log('Applying distance filter client-side:', filters.distances);
          races = races.filter(race => {
            const raceDistances = race.distances || [];
            return filters.distances.some(distance => raceDistances.includes(distance));
          });
        }

        // Terrain profile filter
        if (filters.terrainProfiles && filters.terrainProfiles.length > 0) {
          console.log('Applying terrain profile filter client-side:', filters.terrainProfiles);
          races = races.filter(race => {
            const raceTerrains = race.terrain_profile || [];
            return filters.terrainProfiles.some(terrain => raceTerrains.includes(terrain));
          });
        }
      }

      console.log('RaceDiscoveryService: Fetched and filtered races:', races.length);
      return races;
    } catch (error) {
      console.error('RaceDiscoveryService: Exception in fetchAllRaces:', error);
      throw error;
    }
  }

  // Optimized method for fetching only the latest 3 races for featured section
  static async fetchFeaturedRaces(limit: number = 3) {
    console.log('RaceDiscoveryService: Fetching latest', limit, 'races for featured section');
    
    try {
      const { data, error } = await supabase
        .from('races')
        .select(`
          *,
          host_info:profiles!races_host_id_profiles_fkey(
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          ),
          property_info:properties!races_property_id_properties_fkey(
            id,
            title,
            description,
            locality,
            provinces,
            full_address,
            bedrooms,
            beds,
            bathrooms,
            max_guests,
            amenities,
            house_rules,
            runner_instructions,
            images:property_images(id, image_url, caption, is_main, display_order)
          ),
          race_images(
            id,
            image_url,
            caption,
            category,
            display_order
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('RaceDiscoveryService: Error fetching featured races:', error);
        throw error;
      }

      console.log('RaceDiscoveryService: Fetched', data?.length || 0, 'featured races with property info');
      return data || [];
    } catch (error) {
      console.error('RaceDiscoveryService: Exception in fetchFeaturedRaces:', error);
      throw error;
    }
  }
}


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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        // Province filter - buscar en property_info.locality
        if (filters.province) {
          console.log('Applying province filter:', filters.province);
          // Necesitamos hacer una subconsulta para filtrar por provincia
          const { data: propertiesInProvince } = await supabase
            .from('properties')
            .select('id')
            .ilike('locality', `%${filters.province}%`);
          
          if (propertiesInProvince && propertiesInProvince.length > 0) {
            const propertyIds = propertiesInProvince.map(p => p.id);
            query = query.in('property_id', propertyIds);
          } else {
            // Si no hay propiedades en esa provincia, devolver array vacío
            return [];
          }
        }

        // Month filter
        if (filters.month) {
          console.log('Applying month filter:', filters.month);
          const monthInt = parseInt(filters.month);
          // Filtrar por mes usando extract
          query = query.filter('race_date', 'gte', `${new Date().getFullYear()}-${monthInt.toString().padStart(2, '0')}-01`)
                       .filter('race_date', 'lt', `${new Date().getFullYear()}-${(monthInt + 1).toString().padStart(2, '0')}-01`);
        }

        // Modality filter
        if (filters.modalities && filters.modalities.length > 0) {
          console.log('Applying modality filter:', filters.modalities);
          // Filtrar por modalidades usando contains
          for (const modality of filters.modalities) {
            query = query.contains('modalities', [modality]);
          }
        }

        // Distance filter
        if (filters.distances && filters.distances.length > 0) {
          console.log('Applying distance filter:', filters.distances);
          // Filtrar por distancias usando contains
          for (const distance of filters.distances) {
            query = query.contains('distances', [distance]);
          }
        }

        // Terrain profile filter
        if (filters.terrainProfiles && filters.terrainProfiles.length > 0) {
          console.log('Applying terrain profile filter:', filters.terrainProfiles);
          for (const terrain of filters.terrainProfiles) {
            query = query.contains('terrain_profile', [terrain]);
          }
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

      console.log('RaceDiscoveryService: Fetched races:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('RaceDiscoveryService: Exception in fetchAllRaces:', error);
      throw error;
    }
  }
}

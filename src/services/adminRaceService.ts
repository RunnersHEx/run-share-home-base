import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Create admin service role client for bypassing RLS
let adminClient: any = null;

try {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (serviceRoleKey && supabaseUrl) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Admin client initialized successfully');
  } else {
    console.warn('Service role key not available - using regular client');
  }
} catch (error) {
  console.error('Failed to initialize admin client:', error);
}

export const AdminRaceService = {
  /**
   * Delete a race using admin privileges
   */
  async deleteRace(raceId: string, adminUserId: string, deletionReason?: string) {
    const clientToUse = adminClient || supabase;
    const isUsingAdminClient = !!adminClient;
    
    console.log(`Attempting to delete race ${raceId} using ${isUsingAdminClient ? 'admin' : 'regular'} client`);
    
    try {
      const { data, error } = await clientToUse.rpc('admin_delete_race', {
        p_race_id: raceId,
        p_admin_user_id: adminUserId,
        p_deletion_reason: deletionReason || null
      });

      if (error) {
        console.error('RPC call error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from delete function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Delete operation failed');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Admin delete race error:', error);
      throw error;
    }
  },

  /**
   * Update race status using admin privileges
   */
  async updateRaceStatus(raceId: string, adminUserId: string, isActive: boolean, notes?: string) {
    const clientToUse = adminClient || supabase;
    
    try {
      const { data, error } = await clientToUse.rpc('admin_update_race_status', {
        p_race_id: raceId,
        p_admin_user_id: adminUserId,
        p_new_is_active: isActive,
        p_admin_notes: notes || null
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Status update failed');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Admin update race status error:', error);
      throw error;
    }
  },

  /**
   * Get all races using admin privileges
   */
  async getAllRaces() {
    const clientToUse = adminClient || supabase;
    
    try {
      const { data, error } = await clientToUse
        .from('races')
        .select(`
          *,
          profiles:host_id (
            first_name,
            last_name,
            email
          ),
          properties:property_id (
            id,
            title,
            locality,
            full_address,
            provinces,
            latitude,
            longitude
          ),
          race_images (
            id,
            image_url,
            category,
            caption,
            display_order
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch races: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Admin get races error:', error);
      throw error;
    }
  },

  /**
   * Check if admin client is available
   */
  isAdminClientAvailable() {
    return !!adminClient;
  }
};

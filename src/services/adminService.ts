import { supabase } from "@/integrations/supabase/client";

export interface AdminDeleteUserParams {
  userId: string;
  reason?: string;
}

export interface AdminDeleteUserResult {
  success: boolean;
  error?: string;
}

/**
 * Admin service for managing system operations
 */
export class AdminService {
  
  /**
   * Delete a user account (admin function)
   * This will track the deletion and remove the user from the system
   */
  static async deleteUserAccount(params: AdminDeleteUserParams): Promise<AdminDeleteUserResult> {
    try {
      const { data, error } = await supabase.rpc('admin_delete_user_account', {
        target_user_id: params.userId,
        deletion_reason: params.reason || null
      });

      if (error) {
        console.error('Error deleting user account:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error in deleteUserAccount:', error);
      return {
        success: false,
        error: 'Error inesperado al eliminar la cuenta'
      };
    }
  }

  /**
   * Get account deletion statistics
   */
  static async getDeletionStats() {
    try {
      const { data, error } = await supabase.rpc('get_account_deletion_stats');
      
      if (error) {
        console.error('Error getting deletion stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDeletionStats:', error);
      return null;
    }
  }

  /**
   * Track when a user deletes their own account
   * This should be called before the actual deletion process
   */
  static async trackSelfDeletion(userId: string, reason?: string) {
    try {
      // Get user profile data before deletion
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get booking count
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

      // Insert deletion record
      await supabase.from('account_deletions').insert({
        user_id: userId,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        deletion_type: 'self_deleted',
        deletion_reason: reason,
        total_bookings: bookingCount || 0,
        total_points_at_deletion: profile.points_balance || 0,
        verification_status: profile.verification_status
      });

    } catch (error) {
      console.error('Error tracking self deletion:', error);
      // Don't throw here as this is just tracking, not blocking deletion
    }
  }

  /**
   * Get new users with pagination
   */
  static async getNewUsers(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at, verification_status, verification_documents, is_host, is_guest')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching new users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNewUsers:', error);
      return [];
    }
  }

  /**
   * Get subscription renewals
   */
  static async getSubscriptionRenewals(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_name,
          status,
          current_period_start,
          current_period_end,
          updated_at,
          profiles!inner(email, first_name, last_name)
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching subscription renewals:', error);
        return [];
      }

      const formattedRenewals = data?.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_email: sub.profiles.email || '',
        user_name: `${sub.profiles.first_name || ''} ${sub.profiles.last_name || ''}`.trim(),
        plan_name: sub.plan_name,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        updated_at: sub.updated_at
      })) || [];

      return formattedRenewals;
    } catch (error) {
      console.error('Error in getSubscriptionRenewals:', error);
      return [];
    }
  }

  /**
   * Get account deletions history
   */
  static async getAccountDeletions(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('account_deletions')
        .select('*')
        .order('deleted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching account deletions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAccountDeletions:', error);
      return [];
    }
  }
}

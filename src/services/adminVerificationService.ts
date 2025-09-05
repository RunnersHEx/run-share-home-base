import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Service role client for admin operations (bypasses RLS)
let supabaseServiceRole: any = null;

try {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    supabaseServiceRole = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
} catch (error) {
  console.warn('Service role client not available for verification service');
}

export const AdminVerificationService = {
  // Update user verification status using service role (bypasses RLS)
  async updateVerificationStatus(
    userId: string, 
    status: 'approved' | 'rejected', 
    adminId: string,
    notes?: string
  ): Promise<{success: boolean, error?: string, userName?: string}> {
    try {
      // Use service role client if available, otherwise fall back to regular client
      const clientToUse = supabaseServiceRole || supabase;
      const usingServiceRole = !!supabaseServiceRole;

      console.log('AdminVerificationService: Using', usingServiceRole ? 'service role' : 'regular client');

      // Map status to database values
      const statusMapping = {
        'approved': 'verified',
        'rejected': 'rejected'
      };
      const dbStatus = statusMapping[status];

      // Get user profile first
      const { data: userProfile, error: profileError } = await clientToUse
        .from('profiles')
        .select('first_name, last_name, email, verification_status')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error getting user profile:', profileError);
        return { success: false, error: 'Usuario no encontrado' };
      }

      console.log('User profile found:', userProfile);
      console.log('Current verification status:', userProfile.verification_status);

      // Update verification status
      const { error: updateError } = await clientToUse
        .from('profiles')
        .update({ verification_status: dbStatus })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating verification status:', updateError);
        if (!usingServiceRole) {
          return { 
            success: false, 
            error: 'Permisos de administrador requeridos - configura VITE_SUPABASE_SERVICE_ROLE_KEY en tu .env.local' 
          };
        }
        return { success: false, error: 'Error al actualizar el estado de verificación: ' + updateError.message };
      }

      console.log('Verification status updated successfully to:', dbStatus);

      // Verify the update worked
      const { data: updatedProfile, error: verifyError } = await clientToUse
        .from('profiles')
        .select('verification_status')
        .eq('id', userId)
        .single();

      if (verifyError || updatedProfile?.verification_status !== dbStatus) {
        console.error('Update verification failed:', { 
          verifyError, 
          requestedStatus: dbStatus, 
          actualStatus: updatedProfile?.verification_status
        });
        return { 
          success: false, 
          error: `Error al verificar la actualización del estado. Solicitado: ${dbStatus}, Actual: ${updatedProfile?.verification_status}` 
        };
      }

      // Try to create admin message and notification (optional)
      await this.createAdminNotifications(userId, status, adminId, notes, clientToUse);

      const userName = userProfile.first_name && userProfile.last_name 
        ? `${userProfile.first_name} ${userProfile.last_name}` 
        : userProfile.email;

      return { 
        success: true, 
        userName 
      };

    } catch (error: any) {
      console.error('AdminVerificationService error:', error);
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // Create admin messages and notifications
  async createAdminNotifications(
    userId: string, 
    status: 'approved' | 'rejected', 
    adminId: string, 
    notes: string | undefined,
    client: any
  ) {
    // Create admin message
    try {
      await client.from('admin_messages').insert({
        admin_id: adminId,
        user_id: userId,
        message_type: status === 'approved' ? 'activation' : 'warning',
        title: status === 'approved' ? 'Cuenta verificada' : 'Verificación rechazada',
        message: status === 'approved' 
          ? 'Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de la plataforma.'
          : `Tu solicitud de verificación ha sido rechazada. ${notes ? `Motivo: ${notes}` : ''} Contacta con soporte si necesitas más información.`,
        reason: notes
      });
      console.log('Admin message created successfully');
    } catch (error) {
      console.warn('Could not create admin message:', error);
    }

    // Create notification
    try {
      await client.from('user_notifications').insert({
        user_id: userId,
        type: status === 'approved' ? 'account_verified' : 'verification_rejected',
        title: status === 'approved' ? 'Cuenta verificada' : 'Verificación rechazada',
        message: status === 'approved' 
          ? 'Tu cuenta ha sido verificada exitosamente.'
          : 'Tu solicitud de verificación ha sido rechazada. Revisa los mensajes del administrador para más detalles.',
        data: {
          admin_id: adminId,
          status: status === 'approved' ? 'verified' : 'rejected',
          notes: notes,
          verification_date: new Date().toISOString()
        }
      });
      console.log('Notification created successfully');
    } catch (error) {
      console.warn('Could not create notification:', error);
    }
  },

  // Check if service role is configured
  isServiceRoleAvailable(): boolean {
    return !!supabaseServiceRole;
  },

  // Get service role status for debugging
  getServiceRoleStatus(): {available: boolean, configured: boolean} {
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    return {
      available: !!supabaseServiceRole,
      configured: !!serviceRoleKey
    };
  }
};

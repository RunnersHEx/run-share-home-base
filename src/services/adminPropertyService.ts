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
  console.warn('Service role client not available for property management service');
}

export const AdminPropertyService = {
  // Update property status using service role (bypasses RLS)
  async updatePropertyStatus(
    propertyId: string, 
    status: 'approved' | 'rejected', 
    adminId: string,
    notes?: string
  ): Promise<{success: boolean, error?: string, propertyName?: string, ownerName?: string}> {
    try {
      // Use service role client if available, otherwise fall back to regular client
      const clientToUse = supabaseServiceRole || supabase;
      const usingServiceRole = !!supabaseServiceRole;

      console.log('AdminPropertyService: Using', usingServiceRole ? 'service role' : 'regular client');

      // Get property with owner info first
      const { data: property, error: propertyError } = await clientToUse
        .from('properties')
        .select(`
          id, title, owner_id,
          profiles:owner_id (first_name, last_name, email)
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('Error getting property:', propertyError);
        return { success: false, error: 'Propiedad no encontrada' };
      }

      console.log('Property found:', property);

      // Update property status (is_active field)
      const { error: updateError } = await clientToUse
        .from('properties')
        .update({ 
          is_active: status === 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (updateError) {
        console.error('Error updating property status:', updateError);
        if (!usingServiceRole) {
          return { 
            success: false, 
            error: 'Permisos de administrador requeridos - configura VITE_SUPABASE_SERVICE_ROLE_KEY en tu .env.local' 
          };
        }
        return { success: false, error: 'Error al actualizar el estado de la propiedad: ' + updateError.message };
      }

      console.log('Property status updated successfully to:', status === 'approved' ? 'active' : 'inactive');

      // Try to create admin message and notification (optional)
      await this.createPropertyNotifications(propertyId, property, status, adminId, notes, clientToUse);

      const ownerName = (property.profiles as any)?.first_name && (property.profiles as any)?.last_name 
        ? `${(property.profiles as any).first_name} ${(property.profiles as any).last_name}` 
        : (property.profiles as any)?.email;

      return { 
        success: true, 
        propertyName: property.title,
        ownerName 
      };

    } catch (error: any) {
      console.error('AdminPropertyService error:', error);
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // Delete property using service role (bypasses RLS)
  async deleteProperty(
    propertyId: string, 
    adminId: string,
    reason?: string
  ): Promise<{success: boolean, error?: string, propertyName?: string, ownerName?: string}> {
    try {
      const clientToUse = supabaseServiceRole || supabase;
      const usingServiceRole = !!supabaseServiceRole;

      console.log('AdminPropertyService: Deleting property using', usingServiceRole ? 'service role' : 'regular client');

      // Get property with owner info first
      const { data: property, error: propertyError } = await clientToUse
        .from('properties')
        .select(`
          id, title, owner_id,
          profiles:owner_id (first_name, last_name, email)
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('Error getting property:', propertyError);
        return { success: false, error: 'Propiedad no encontrada' };
      }

      // Create notifications before deletion
      await this.createPropertyDeletionNotifications(property, adminId, reason, clientToUse);

      // Delete related records first
      await clientToUse.from('property_images').delete().eq('property_id', propertyId);
      await clientToUse.from('property_availability').delete().eq('property_id', propertyId);

      // Delete the property
      const { error: deleteError } = await clientToUse
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (deleteError) {
        console.error('Error deleting property:', deleteError);
        if (!usingServiceRole) {
          return { 
            success: false, 
            error: 'Permisos de administrador requeridos - configura VITE_SUPABASE_SERVICE_ROLE_KEY en tu .env.local' 
          };
        }
        return { success: false, error: 'Error al eliminar la propiedad: ' + deleteError.message };
      }

      const ownerName = (property.profiles as any)?.first_name && (property.profiles as any)?.last_name 
        ? `${(property.profiles as any).first_name} ${(property.profiles as any).last_name}` 
        : (property.profiles as any)?.email;

      return { 
        success: true, 
        propertyName: property.title,
        ownerName 
      };

    } catch (error: any) {
      console.error('AdminPropertyService delete error:', error);
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // Create admin messages and notifications for property actions
  async createPropertyNotifications(
    propertyId: string,
    property: any, 
    status: 'approved' | 'rejected', 
    adminId: string, 
    notes: string | undefined,
    client: any
  ) {
    // Create admin message
    try {
      await client.from('admin_messages').insert({
        admin_id: adminId,
        user_id: property.owner_id,
        message_type: status === 'approved' ? 'activation' : 'warning',
        title: status === 'approved' ? 'Propiedad aprobada' : 'Propiedad rechazada',
        message: status === 'approved' 
          ? `Tu propiedad "${property.title}" ha sido aprobada y ya está disponible para reservas.`
          : `Tu propiedad "${property.title}" ha sido rechazada. ${notes ? `Motivo: ${notes}` : ''} Contacta con soporte si necesitas más información.`,
        reason: notes
      });
      console.log('Property admin message created successfully');
    } catch (error) {
      console.warn('Could not create property admin message:', error);
    }

    // Create notification
    try {
      await client.from('user_notifications').insert({
        user_id: property.owner_id,
        type: status === 'approved' ? 'property_approved' : 'property_rejected',
        title: status === 'approved' ? 'Propiedad aprobada' : 'Propiedad rechazada',
        message: status === 'approved' 
          ? `Tu propiedad "${property.title}" ha sido aprobada exitosamente.`
          : `Tu propiedad "${property.title}" ha sido rechazada. Revisa los mensajes del administrador para más detalles.`,
        data: {
          admin_id: adminId,
          property_id: propertyId,
          property_title: property.title,
          action: status === 'approved' ? 'approve' : 'reject',
          notes: notes,
          action_date: new Date().toISOString()
        }
      });
      console.log('Property notification created successfully');
    } catch (error) {
      console.warn('Could not create property notification:', error);
    }
  },

  // Create admin messages and notifications for property deletion
  async createPropertyDeletionNotifications(
    property: any, 
    adminId: string, 
    reason: string | undefined,
    client: any
  ) {
    // Create admin message
    try {
      await client.from('admin_messages').insert({
        admin_id: adminId,
        user_id: property.owner_id,
        message_type: 'general',
        title: 'Propiedad eliminada',
        message: `Tu propiedad "${property.title}" ha sido eliminada permanentemente. ${reason || 'Propiedad eliminada por el administrador'}`,
        reason: reason
      });
      console.log('Property deletion admin message created successfully');
    } catch (error) {
      console.warn('Could not create property deletion admin message:', error);
    }

    // Create notification
    try {
      await client.from('user_notifications').insert({
        user_id: property.owner_id,
        type: 'property_deleted',
        title: 'Propiedad eliminada',
        message: `Tu propiedad "${property.title}" ha sido eliminada. Revisa los mensajes del administrador para más detalles.`,
        data: {
          admin_id: adminId,
          property_id: property.id,
          property_title: property.title,
          deletion_date: new Date().toISOString(),
          reason: reason
        }
      });
      console.log('Property deletion notification created successfully');
    } catch (error) {
      console.warn('Could not create property deletion notification:', error);
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

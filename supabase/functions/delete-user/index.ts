// @ts-nocheck - Deno environment, not Node.js
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  user_id: string;
  confirmation_text: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Configuración del servidor incorrecta',
          details: 'Variables de entorno faltantes'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Formato de solicitud inválido',
          details: 'El cuerpo de la solicitud no es JSON válido'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { user_id, confirmation_text }: DeleteUserRequest = requestBody;

    console.log(`=== INICIANDO ELIMINACIÓN DE CUENTA ===`);
    console.log(`Usuario ID: ${user_id}`);
    console.log(`Confirmation text received: "${confirmation_text}"`);
    console.log(`Confirmation text type: ${typeof confirmation_text}`);
    console.log(`Confirmation text length: ${confirmation_text?.length}`);
    console.log(`Request body:`, JSON.stringify(requestBody, null, 2));

    // Validate required fields
    if (!user_id) {
      console.log('❌ Missing user_id');
      return new Response(
        JSON.stringify({ 
          error: 'ID de usuario requerido',
          details: 'El campo user_id es obligatorio'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Verify confirmation text (accept both Spanish and English)
    const validConfirmations = ["ELIMINAR MI CUENTA", "DELETE MY ACCOUNT"];
    console.log(`Valid confirmations: ${JSON.stringify(validConfirmations)}`);
    
    if (!confirmation_text || !validConfirmations.includes(confirmation_text.trim())) {
      console.log(`❌ Confirmation text mismatch. Expected one of: ${JSON.stringify(validConfirmations)}, received: "${confirmation_text}"`);
      return new Response(
        JSON.stringify({ 
          error: 'Texto de confirmación incorrecto',
          details: `Debe escribir exactamente "ELIMINAR MI CUENTA" o "DELETE MY ACCOUNT". Recibido: "${confirmation_text}"`,
          received_text: confirmation_text,
          valid_options: validConfirmations
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Verify that the user actually exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserById(user_id);
    if (userCheckError || !existingUser?.user) {
      console.log(`❌ User not found in auth system: ${user_id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Usuario no encontrado',
          details: 'El usuario no existe en el sistema de autenticación'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get user data before deletion for logging
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user_id)
      .single();

    if (userData) {
      console.log(`Eliminando cuenta de: ${userData.first_name} ${userData.last_name} (${userData.email})`);
    }

    // Delete user's data in the correct order (respecting foreign key constraints)
    console.log('🗑️ Eliminando datos del usuario...');

    // 1. Delete booking messages
    const { error: msgError } = await supabase
      .from('booking_messages')
      .delete()
      .eq('sender_id', user_id);
    if (msgError) console.log('Warning deleting booking messages:', msgError);

    // 2. Delete booking reviews (both as reviewer and reviewee)
    const { error: reviewError1 } = await supabase
      .from('booking_reviews')
      .delete()
      .eq('reviewer_id', user_id);
    if (reviewError1) console.log('Warning deleting reviews as reviewer:', reviewError1);

    const { error: reviewError2 } = await supabase
      .from('booking_reviews')
      .delete()
      .eq('reviewee_id', user_id);
    if (reviewError2) console.log('Warning deleting reviews as reviewee:', reviewError2);

    // 3. Delete bookings (as guest or host)
    const { error: bookingError1 } = await supabase
      .from('bookings')
      .delete()
      .eq('guest_id', user_id);
    if (bookingError1) console.log('Warning deleting bookings as guest:', bookingError1);

    const { error: bookingError2 } = await supabase
      .from('bookings')
      .delete()
      .eq('host_id', user_id);
    if (bookingError2) console.log('Warning deleting bookings as host:', bookingError2);

    // 4. Delete conversations
    const { error: convError1 } = await supabase
      .from('conversations')
      .delete()
      .eq('participant_1_id', user_id);
    if (convError1) console.log('Warning deleting conversations p1:', convError1);

    const { error: convError2 } = await supabase
      .from('conversations')
      .delete()
      .eq('participant_2_id', user_id);
    if (convError2) console.log('Warning deleting conversations p2:', convError2);

    // 5. Delete points transactions
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .delete()
      .eq('user_id', user_id);
    if (pointsError) console.log('Warning deleting points transactions:', pointsError);

    // 6. Delete verification requests
    const { error: verificationError } = await supabase
      .from('verification_requests')
      .delete()
      .eq('user_id', user_id);
    if (verificationError) console.log('Warning deleting verification requests:', verificationError);

    // 7. Delete subscriptions
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id);
    if (subscriptionError) console.log('Warning deleting subscriptions:', subscriptionError);

    // 8. Delete user notifications
    const { error: notificationError } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', user_id);
    if (notificationError) console.log('Warning deleting notifications:', notificationError);

    // 9. Delete property-related data
    const { data: userProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', user_id);

    if (userProperties && userProperties.length > 0) {
      const propertyIds = userProperties.map(p => p.id);
      
      // Delete property images
      const { error: propImgError } = await supabase
        .from('property_images')
        .delete()
        .in('property_id', propertyIds);
      if (propImgError) console.log('Warning deleting property images:', propImgError);

      // Delete property availability
      const { error: propAvailError } = await supabase
        .from('property_availability')
        .delete()
        .in('property_id', propertyIds);
      if (propAvailError) console.log('Warning deleting property availability:', propAvailError);
    }

    // 10. Delete user properties
    const { error: propertyError } = await supabase
      .from('properties')
      .delete()
      .eq('owner_id', user_id);
    if (propertyError) console.log('Warning deleting properties:', propertyError);

    // 11. Delete race-related data
    const { data: userRaces } = await supabase
      .from('races')
      .select('id')
      .eq('host_id', user_id);

    if (userRaces && userRaces.length > 0) {
      const raceIds = userRaces.map(r => r.id);
      
      // Delete race images
      const { error: raceImgError } = await supabase
        .from('race_images')
        .delete()
        .in('race_id', raceIds);
      if (raceImgError) console.log('Warning deleting race images:', raceImgError);
    }

    // 12. Delete user races
    const { error: raceError } = await supabase
      .from('races')
      .delete()
      .eq('host_id', user_id);
    if (raceError) console.log('Warning deleting races:', raceError);

    // 13. Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user_id);
    if (profileError) {
      console.error('❌ Error deleting profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Error al eliminar el perfil de usuario',
          details: profileError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 14. Delete from storage buckets
    console.log('🗂️ Limpiando archivos de almacenamiento...');
    try {
      // Delete avatar files
      await supabase.storage
        .from('avatars')
        .remove([`${user_id}/avatar.jpg`, `${user_id}/avatar.png`, `${user_id}/avatar.jpeg`]);
      
      // Delete verification documents
      const { data: verificationFiles } = await supabase.storage
        .from('verification-docs')
        .list(user_id);
      
      if (verificationFiles && verificationFiles.length > 0) {
        const filePaths = verificationFiles.map(file => `${user_id}/${file.name}`);
        await supabase.storage
          .from('verification-docs')
          .remove(filePaths);
      }
    } catch (storageError) {
      console.log('⚠️ Storage cleanup completed with warnings:', storageError);
    }

    // 15. Finally, delete the user from auth system
    console.log('🔐 Eliminando usuario del sistema de autenticación...');
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
    
    if (authError) {
      console.error('❌ Error deleting user from auth:', authError);
      // If auth deletion fails, we should still report success if data was cleaned up
      // since the user's data is gone, they just might need admin intervention
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'Datos del usuario eliminados, pero error en autenticación',
          message: 'Los datos del usuario fueron eliminados exitosamente, pero hubo un problema eliminando la cuenta de autenticación. Contacta al soporte.',
          auth_error: authError.message,
          deleted_user_id: user_id,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200, // Still return 200 since data was deleted
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ Cuenta eliminada exitosamente');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cuenta eliminada exitosamente',
        deleted_user_id: user_id,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error en delete-user:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

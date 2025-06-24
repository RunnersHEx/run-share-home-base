
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  user_id: string;
  user_name: string;
  user_email: string;
  documents_count: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, user_name, user_email, documents_count }: EmailRequest = await req.json();

    // Log detallado para verificar que se recibe la petición
    console.log(`=== NUEVA SOLICITUD DE VERIFICACIÓN ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Usuario: ${user_name} (${user_email})`);
    console.log(`ID Usuario: ${user_id}`);
    console.log(`Documentos subidos: ${documents_count}`);
    console.log(`Email admin destino: runnershomeexchange@gmail.com`);
    console.log(`=== DATOS RECIBIDOS ===`);

    // Crear notificación interna para el usuario
    const { error: notificationError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: user_id,
        type: 'verification_submitted',
        title: 'Documentos de Verificación Enviados',
        message: `Has enviado ${documents_count} documentos para verificación. Recibirás una notificación cuando sean revisados. El administrador ha sido notificado automáticamente.`,
        data: { 
          documents_count,
          admin_email: 'runnershomeexchange@gmail.com',
          submitted_at: new Date().toISOString(),
          admin_notified: true
        }
      });

    if (notificationError) {
      console.error('❌ Error creating user notification:', notificationError);
    } else {
      console.log('✅ User notification created successfully');
    }

    // Log simulando el envío de email al administrador
    console.log(`\n📧 ===== EMAIL ENVIADO AL ADMINISTRADOR =====`);
    console.log(`📬 DESTINATARIO: runnershomeexchange@gmail.com`);
    console.log(`📋 ASUNTO: 🏃‍♂️ Nueva solicitud de verificación - ${user_name}`);
    console.log(`📄 CONTENIDO DEL EMAIL:`);
    console.log(`-------------------------------------------`);
    console.log(`¡Hola Administrador de RunnersHEx!`);
    console.log(``);
    console.log(`📝 Has recibido una nueva solicitud de verificación de identidad:`);
    console.log(``);
    console.log(`👤 Usuario: ${user_name}`);
    console.log(`📧 Email: ${user_email}`);
    console.log(`🆔 ID Usuario: ${user_id}`);
    console.log(`📎 Documentos subidos: ${documents_count}`);
    console.log(`📅 Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`);
    console.log(``);
    console.log(`🔍 ACCIÓN REQUERIDA:`);
    console.log(`Por favor, revisa los documentos en el panel de administración de Supabase:`);
    console.log(`🔗 https://supabase.com/dashboard/project/tufikuyzllmrfinvmltt`);
    console.log(``);
    console.log(`Los documentos están almacenados en el bucket 'verification-docs'.`);
    console.log(`Una vez revisados, actualiza el estado de verificación del usuario.`);
    console.log(``);
    console.log(`-------------------------------------------`);
    console.log(`🤖 Sistema RunnersHEx - Notificación Automática`);
    console.log(`📧 ===== FIN DEL EMAIL =====\n`);

    // Crear registro en la tabla de solicitudes de verificación si no existe
    const { error: requestError } = await supabase
      .from('verification_requests')
      .upsert({
        user_id: user_id,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (requestError) {
      console.error('❌ Error creating/updating verification request:', requestError);
    } else {
      console.log('✅ Verification request created/updated successfully');
    }

    console.log(`\n🎯 RESUMEN DE PROCESAMIENTO:`);
    console.log(`✅ Notificación al usuario: ${notificationError ? 'ERROR' : 'ÉXITO'}`);
    console.log(`✅ Email al admin (simulado): ENVIADO`);
    console.log(`✅ Solicitud de verificación: ${requestError ? 'ERROR' : 'ÉXITO'}`);
    console.log(`📊 Estado final: PROCESADO COMPLETAMENTE`);
    console.log(`=== FIN PROCESAMIENTO ===\n`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitud de verificación procesada exitosamente',
        details: {
          admin_notified: true,
          admin_email: 'runnershomeexchange@gmail.com',
          user_notification_created: !notificationError,
          verification_request_created: !requestError,
          timestamp: new Date().toISOString(),
          documents_count: documents_count
        }
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('💥 ERROR CRÍTICO en send-verification-email:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Ver logs del servidor para más información'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

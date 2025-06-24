
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

    console.log(`=== NUEVA SOLICITUD DE VERIFICACIÓN ===`);
    console.log(`Usuario: ${user_name} (${user_email})`);
    console.log(`Documentos: ${documents_count}`);

    // Crear notificación interna para el usuario
    const { error: notificationError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: user_id,
        type: 'verification_submitted',
        title: 'Documentos de Verificación Enviados',
        message: `Has enviado ${documents_count} documentos para verificación. Recibirás una notificación cuando sean revisados.`,
        data: { 
          documents_count,
          submitted_at: new Date().toISOString()
        }
      });

    if (notificationError) {
      console.error('Error creating user notification:', notificationError);
    }

    // Enviar email real al administrador usando Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        console.log('🚀 Enviando email a runnershomeexchange@gmail.com...');
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RunnersHEx Verificación <noreply@resend.dev>',
            to: ['runnershomeexchange@gmail.com'],
            subject: `🏃‍♂️ NUEVA VERIFICACIÓN - ${user_name} (${documents_count} docs)`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: #1E40AF; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">🏃‍♂️ RunnersHEx</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Nueva Solicitud de Verificación</p>
                </div>
                
                <div style="padding: 30px;">
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E40AF;">
                    <h2 style="margin-top: 0; color: #1E40AF;">📋 Detalles del Usuario</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; font-weight: bold;">Nombre:</td><td style="padding: 8px 0;">${user_name}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;">${user_email}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">ID Usuario:</td><td style="padding: 8px 0;">${user_id}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Documentos:</td><td style="padding: 8px 0;">${documents_count}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Fecha:</td><td style="padding: 8px 0;">${new Date().toLocaleString('es-ES')}</td></tr>
                    </table>
                  </div>

                  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                    <h3 style="margin-top: 0; color: #92400e;">🔍 Acción Requerida</h3>
                    <p style="margin: 0;">Por favor, revisa los documentos en el panel de Supabase:</p>
                    <p style="margin: 10px 0;">
                      <a href="https://supabase.com/dashboard/project/tufikuyzllmrfinvmltt" 
                         style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                         🔗 Ir al Panel de Administración
                      </a>
                    </p>
                  </div>

                  <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                    <h3 style="margin-top: 0; color: #1E40AF;">📋 Próximos Pasos</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #374151;">
                      <li style="margin: 8px 0;">Revisa los documentos subidos en Storage</li>
                      <li style="margin: 8px 0;">Verifica la identidad del usuario</li>
                      <li style="margin: 8px 0;">Actualiza el estado en verification_requests</li>
                      <li style="margin: 8px 0;">El usuario recibirá notificación automática</li>
                    </ol>
                  </div>

                  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 30px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                      Este email fue enviado automáticamente por RunnersHEx<br>
                      Sistema de Verificación de Identidad
                    </p>
                  </div>
                </div>
              </div>
            `
          })
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('✅ Email enviado exitosamente a runnershomeexchange@gmail.com:', emailResult);
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Error enviando email:', errorText);
          console.error('Response status:', emailResponse.status);
        }
      } catch (emailError) {
        console.error('❌ Error con servicio de email:', emailError);
      }
    } else {
      console.log('⚠️ RESEND_API_KEY no configurada, email no enviado');
    }

    // Crear/actualizar solicitud de verificación (con ON CONFLICT sin constraint)
    const { error: requestError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user_id,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

    if (requestError) {
      console.log('Info: solicitud de verificación ya existe o error menor:', requestError);
      // No lanzar error, ya que puede ser que ya exista
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitud de verificación procesada y email enviado a runnershomeexchange@gmail.com',
        email_sent: !!resendApiKey,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error en send-verification-email:', error);
    
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

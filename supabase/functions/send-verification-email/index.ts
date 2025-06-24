
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
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RunnersHEx <noreply@resend.dev>',
            to: ['runnershomeexchange@gmail.com'],
            subject: `🏃‍♂️ Nueva verificación de identidad - ${user_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1E40AF;">🏃‍♂️ Nueva Solicitud de Verificación</h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Detalles del Usuario</h3>
                  <p><strong>Nombre:</strong> ${user_name}</p>
                  <p><strong>Email:</strong> ${user_email}</p>
                  <p><strong>ID Usuario:</strong> ${user_id}</p>
                  <p><strong>Documentos subidos:</strong> ${documents_count}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                </div>

                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #92400e;">🔍 Acción Requerida</h3>
                  <p>Por favor, revisa los documentos en el panel de administración:</p>
                  <p><a href="https://supabase.com/dashboard/project/tufikuyzllmrfinvmltt" 
                     style="color: #1E40AF; text-decoration: underline;">
                     Ir al Panel de Administración
                  </a></p>
                </div>

                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1E40AF;">📋 Próximos Pasos</h3>
                  <ol style="margin: 0; padding-left: 20px;">
                    <li>Revisa los documentos subidos</li>
                    <li>Verifica la identidad del usuario</li>
                    <li>Actualiza el estado de verificación</li>
                    <li>El usuario recibirá una notificación automática</li>
                  </ol>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Este email fue enviado automáticamente por el sistema RunnersHEx.
                </p>
              </div>
            `
          })
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log('✅ Email enviado exitosamente:', emailResult);
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Error enviando email:', errorText);
        }
      } catch (emailError) {
        console.error('❌ Error con servicio de email:', emailError);
      }
    } else {
      console.log('⚠️ RESEND_API_KEY no configurada, email no enviado');
    }

    // Crear/actualizar solicitud de verificación
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
      console.error('Error creating verification request:', requestError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitud de verificación procesada y email enviado',
        email_sent: !!resendApiKey
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
        details: 'Ver logs del servidor'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

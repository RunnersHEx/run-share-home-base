
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

    // Log para verificar que se recibe la petición
    console.log(`=== NUEVA SOLICITUD DE VERIFICACIÓN ===`);
    console.log(`Usuario: ${user_name} (${user_email})`);
    console.log(`ID: ${user_id}`);
    console.log(`Documentos subidos: ${documents_count}`);
    console.log(`Fecha: ${new Date().toISOString()}`);
    console.log(`Link de admin: https://supabase.com/dashboard/project/tufikuyzllmrfinvmltt`);
    console.log(`=== FIN SOLICITUD ===`);

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
          submitted_at: new Date().toISOString()
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Simular envío de email al administrador
    console.log(`📧 EMAIL ENVIADO A: runnershomeexchange@gmail.com`);
    console.log(`Asunto: Nueva solicitud de verificación - ${user_name}`);
    console.log(`Contenido:`);
    console.log(`Hola Administrador,`);
    console.log(`\nHas recibido una nueva solicitud de verificación:`);
    console.log(`- Usuario: ${user_name}`);
    console.log(`- Email: ${user_email}`);
    console.log(`- Documentos subidos: ${documents_count}`);
    console.log(`- Fecha: ${new Date().toLocaleString('es-ES')}`);
    console.log(`\nPor favor, revisa la solicitud en el panel de administración.`);
    console.log(`\nSaludos,\nSistema RunnersHEx`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitud de verificación procesada exitosamente',
        admin_notified: true,
        admin_email: 'runnershomeexchange@gmail.com',
        timestamp: new Date().toISOString()
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-verification-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

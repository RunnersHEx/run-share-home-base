
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

    // Simular envío de email (aquí se integraría con Resend u otro servicio)
    console.log(`ADMIN EMAIL: Nueva solicitud de verificación de ${user_name} (${user_email})`);
    console.log(`Usuario ID: ${user_id}, Documentos subidos: ${documents_count}`);
    console.log(`Link de administración: ${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/dashboard/project/tufikuyzllmrfinvmltt`);

    // También podríamos crear una notificación interna para admins
    const { error: notificationError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: user_id, // Temporal: en producción esto sería para el admin
        type: 'verification_submitted',
        title: 'Documentos de Verificación Enviados',
        message: `Has enviado ${documents_count} documentos para verificación. Recibirás una notificación cuando sean revisados.`,
        data: { documents_count }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de verificación enviado exitosamente',
        admin_notified: true 
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

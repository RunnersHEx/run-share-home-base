import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('Starting expired race requests check...')

    // Call the enhanced check_expired_bookings function
    const { data, error } = await supabaseClient.rpc('check_expired_bookings')

    if (error) {
      console.error('Error calling check_expired_bookings:', error)
      throw error
    }

    console.log('Successfully processed expired race requests')

    // Log some statistics for monitoring
    const { data: expiredCount } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('status', 'rejected')
      .eq('host_response_message', 'Expired - no response within 48 hours')
      .gte('rejected_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

    const processedCount = expiredCount?.length || 0
    console.log(`Processed ${processedCount} expired race requests in this run`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Expired race requests processed successfully',
        processed_count: processedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in handle-expired-race-requests function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    )
  }
})

/* 
 * This Edge Function automatically handles expired race booking requests.
 * Recommended schedule: Every hour to check for expired race booking requests.
 * 
 * What it does:
 * 1. Marks expired pending bookings as rejected
 * 2. Refunds points to guests who made the requests
 * 3. Penalizes hosts with -30 points for not responding
 * 4. Makes races available for booking again (sets is_available_for_booking = true)
 * 5. Sends penalty notification to hosts with the specified message
 * 6. Sends refund notification to guests about automatic refund
 * 
 * Host penalty message:
 * "Recibiste una solicitud de carrera pero no respondiste antes de la fecha límite, 
 * por lo que tu carrera aparece nuevamente en la búsqueda de carreras como activa 
 * a menos que la elimines, y tú como anfitrión eres penalizado con una deducción 
 * de 30 puntos. Esperamos no tener que enviarte este mensaje nuevamente. 
 * Muchas gracias por tu comprensión."
 * 
 * Guest refund message:
 * "Tu solicitud para [race_name] ha expirado porque el anfitrión no respondió a tiempo. 
 * Se han reembolsado [points_cost] puntos a tu cuenta automáticamente."
 */

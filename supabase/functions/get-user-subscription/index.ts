import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET-USER-SUBSCRIPTION] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [GET-USER-SUBSCRIPTION] ${message}`, error ? JSON.stringify(error) : '');
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Create service role client to bypass RLS
  const supabaseServiceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { userId } = await req.json();
    
    // Verify that the requested userId matches the authenticated user
    if (userId !== user.id) {
      throw new Error("Unauthorized: Cannot access other user's subscription data");
    }

    log.info("Fetching subscription data", { userId });

    // Fetch subscription using service role (bypasses RLS)
    const { data: subscription, error: subError } = await supabaseServiceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      log.error("Error fetching subscription", subError);
      throw new Error("Error fetching subscription data");
    }

    let paymentHistory = [];

    // If subscription exists, fetch payment history
    if (subscription) {
      const { data: payments, error: paymentError } = await supabaseServiceClient
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('payment_date', { ascending: false })
        .limit(5);

      if (!paymentError && payments) {
        paymentHistory = payments;
      }

      log.info("Subscription data retrieved successfully", { 
        subscriptionId: subscription.id, 
        paymentCount: paymentHistory.length 
      });
    } else {
      log.info("No subscription found for user", { userId });
    }

    return new Response(JSON.stringify({
      subscription,
      paymentHistory
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    log.error('Error retrieving user subscription', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

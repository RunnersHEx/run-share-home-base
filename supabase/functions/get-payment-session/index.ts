import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET-PAYMENT-SESSION] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [GET-PAYMENT-SESSION] ${message}`, error ? JSON.stringify(error) : '');
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

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    // Get request body
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    log.info("Getting payment session details", { sessionId, userId: user.id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    // Verify that this session belongs to the authenticated user
    // Handle both old flow (user_id in metadata) and new flow (createAccount with email)
    const isOldFlow = session.metadata?.user_id === user.id;
    const isNewFlow = session.metadata?.createAccount === "true" && 
                     (session.metadata?.email === user.email || session.customer_email === user.email);
    
    if (!isOldFlow && !isNewFlow) {
      log.error("Session verification failed", {
        sessionMetadata: session.metadata,
        userEmail: user.email,
        customerEmail: session.customer_email,
        userId: user.id
      });
      throw new Error("Session does not belong to authenticated user");
    }

    log.info("Session ownership verified", {
      flow: isOldFlow ? 'existing-user' : 'new-account',
      sessionId,
      userEmail: user.email
    });

    log.info("Session retrieved successfully", {
      sessionId,
      status: session.payment_status,
      customerEmail: session.customer_email,
      flow: isOldFlow ? 'existing-user' : 'new-account'
    });

    // Return session details
    return new Response(JSON.stringify({
      id: session.id,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      subscription: session.subscription,
      metadata: session.metadata,
      created: session.created
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    log.error('Error retrieving payment session', {
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

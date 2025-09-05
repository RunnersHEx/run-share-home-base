import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseServiceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Sync subscription status started");

    // Check environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      throw new Error("User not authenticated");
    }

    const user = data.user;
    logStep("User authenticated", { userId: user.id });

    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabaseServiceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      if (subError.code === 'PGRST116') {
        return new Response(JSON.stringify({ 
          error: "No subscription found for this user" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      throw new Error(`Database error: ${subError.message}`);
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found");
    }

    logStep("Found subscription", { 
      subscriptionId: subscription.stripe_subscription_id,
      currentStatus: subscription.status 
    });

    // Initialize Stripe and get current subscription status
    const stripe = new Stripe(stripeSecretKey, { 
      apiVersion: "2023-10-16" 
    });

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    logStep("Retrieved Stripe subscription", { 
      stripeStatus: stripeSubscription.status,
      cancelAt: stripeSubscription.cancel_at,
      canceledAt: stripeSubscription.canceled_at,
      currentPeriodEnd: stripeSubscription.current_period_end
    });

    // Map Stripe statuses to our database statuses
    const statusMap: { [key: string]: string } = {
      'active': 'active',
      'canceled': 'canceled',
      'past_due': 'past_due',
      'unpaid': 'unpaid',
      'incomplete': 'inactive',
      'incomplete_expired': 'inactive',
      'trialing': 'active'
    };

    const newStatus = statusMap[stripeSubscription.status] || 'inactive';
    
    // Update subscription in database
    const { error: updateError } = await supabaseServiceClient
      .from('subscriptions')
      .update({
        status: newStatus,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    logStep("Subscription status synchronized successfully", {
      oldStatus: subscription.status,
      newStatus: newStatus,
      periodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      oldStatus: subscription.status,
      newStatus: newStatus,
      stripeStatus: stripeSubscription.status,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      message: `Subscription status updated from "${subscription.status}" to "${newStatus}"`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

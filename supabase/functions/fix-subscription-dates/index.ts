import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [FIX-SUBSCRIPTION-DATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting subscription dates fix");

    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    const stripe = new Stripe(stripeSecretKey, { 
      apiVersion: "2023-10-16" 
    });

    // Get all subscriptions with NULL dates
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .or('current_period_start.is.null,current_period_end.is.null');

    if (fetchError) {
      logStep("ERROR fetching subscriptions", fetchError);
      throw fetchError;
    }

    logStep(`Found ${subscriptions?.length || 0} subscriptions with missing dates`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No subscriptions found with missing dates" 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      try {
        logStep(`Processing subscription ${subscription.id}`, {
          userId: subscription.user_id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          currentStart: subscription.current_period_start,
          currentEnd: subscription.current_period_end
        });

        let currentPeriodStart: Date;
        let currentPeriodEnd: Date;

        if (subscription.stripe_subscription_id) {
          try {
            // Try to get actual dates from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
            currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            
            logStep(`Retrieved dates from Stripe for subscription ${subscription.id}`, {
              start: currentPeriodStart.toISOString(),
              end: currentPeriodEnd.toISOString(),
              status: stripeSubscription.status
            });
          } catch (stripeError) {
            logStep(`Could not retrieve from Stripe, using fallback dates for ${subscription.id}`, stripeError);
            // Use creation date as start, and add 1 year
            currentPeriodStart = new Date(subscription.created_at);
            currentPeriodEnd = new Date(subscription.created_at);
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          }
        } else {
          logStep(`No Stripe subscription ID, using fallback dates for ${subscription.id}`);
          // Use creation date as start, and add 1 year
          currentPeriodStart = new Date(subscription.created_at);
          currentPeriodEnd = new Date(subscription.created_at);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }

        // Update the subscription with the correct dates
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          logStep(`ERROR updating subscription ${subscription.id}`, updateError);
          errorCount++;
        } else {
          logStep(`✅ Successfully updated subscription ${subscription.id}`, {
            start: currentPeriodStart.toISOString(),
            end: currentPeriodEnd.toISOString()
          });
          updatedCount++;
        }
      } catch (error) {
        logStep(`ERROR processing subscription ${subscription.id}`, error);
        errorCount++;
      }
    }

    logStep("Fix completed", {
      total: subscriptions.length,
      updated: updatedCount,
      errors: errorCount
    });

    return new Response(JSON.stringify({ 
      success: true,
      total: subscriptions.length,
      updated: updatedCount,
      errors: errorCount,
      message: `Successfully updated ${updatedCount} subscriptions`
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("💥 ERROR in fix process", {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

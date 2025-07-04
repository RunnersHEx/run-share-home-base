
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    logStep("Event verified", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.metadata?.user_id) {
          const userId = session.metadata.user_id;
          const planType = session.metadata.plan_type || "runner_annual";
          
          logStep("Processing subscription creation", { userId, planType });

          // Create subscription record
          const { error: subError } = await supabaseClient
            .from('subscribers')
            .upsert({
              user_id: userId,
              email: session.customer_email!,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan_type: planType,
              status: 'active',
              subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }, { onConflict: 'user_id' });

          if (subError) throw subError;

          // Allocate subscription points (1200 for annual plan)
          const { error: pointsError } = await supabaseClient.rpc('allocate_subscription_points', {
            p_user_id: userId,
            p_points: 1200,
            p_subscription_id: null, // Will be updated after subscription is created
            p_description: 'Puntos de membresía anual - 1200 puntos incluidos'
          });

          if (pointsError) throw pointsError;

          logStep("Subscription and points allocated successfully");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.billing_reason === "subscription_cycle") {
          // Renewal - allocate more points
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          
          if (typeof customer !== 'string' && customer.metadata?.user_id) {
            const userId = customer.metadata.user_id;
            
            logStep("Processing subscription renewal", { userId });

            // Allocate renewal points
            const { error: pointsError } = await supabaseClient.rpc('allocate_subscription_points', {
              p_user_id: userId,
              p_points: 1200,
              p_subscription_id: null,
              p_description: 'Renovación anual - 1200 puntos incluidos'
            });

            if (pointsError) throw pointsError;

            logStep("Renewal points allocated successfully");
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (typeof customer !== 'string' && customer.metadata?.user_id) {
          const userId = customer.metadata.user_id;
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'canceled' ? 'canceled' : 'expired';
          
          logStep("Updating subscription status", { userId, status });

          const { error } = await supabaseClient
            .from('subscribers')
            .update({ 
              status,
              subscription_end: subscription.current_period_end ? 
                new Date(subscription.current_period_end * 1000).toISOString() : null
            })
            .eq('user_id', userId);

          if (error) throw error;

          logStep("Subscription status updated successfully");
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

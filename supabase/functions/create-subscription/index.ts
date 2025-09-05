
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Production-ready logging for Edge Functions
const log = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error ? JSON.stringify(error) : '');
  }
};

// Helper function to get or create the annual price
// This prevents duplicate products being created for each subscription
async function getOrCreateAnnualPrice(stripe: any): Promise<string> {
  try {
    // Check if product already exists
    const existingProducts = await stripe.products.list({
      active: true,
      limit: 100
    });

    const runnerProduct = existingProducts.data.find((p: any) => 
      p.name === "Membresía RunnersHEx" || 
      p.metadata?.type === "runner_membership"
    );

    let productId: string;

    if (runnerProduct) {
      log.info("Found existing product", { productId: runnerProduct.id });
      productId = runnerProduct.id;
    } else {
      // Create the main product
      const product = await stripe.products.create({
        name: "Membresía RunnersHEx",
        description: "Membresía anual para corredores - Acceso completo a la plataforma RunnersHEx",
        metadata: {
          type: "runner_membership",
          plan: "annual"
        },
        tax_code: "txcd_10000000", // Digital services tax code
      });
      
      log.info("Created new product", { productId: product.id });
      productId = product.id;
    }

    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100
    });

    const annualPrice = existingPrices.data.find((p: any) => 
      p.unit_amount === 5900 && 
      p.currency === "eur" && 
      p.recurring?.interval === "year"
    );

    if (annualPrice) {
      log.info("Found existing annual price", { priceId: annualPrice.id });
      return annualPrice.id;
    } else {
      // Create the annual price
      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: 5900, // €59.00
        recurring: {
          interval: "year",
          interval_count: 1,
        },
        product: productId,
        nickname: "Annual Runner Membership",
        metadata: {
          plan_type: "runner_annual",
          points_awarded: "30_new_50_renewal"
        }
      });

      log.info("Created new annual price", { priceId: price.id });
      return price.id;
    }
  } catch (error) {
    log.error("Failed to get/create annual price", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Parse request body to get coupon code if provided
    const body = await req.json().catch(() => ({}));
    const { couponCode } = body;

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Use predefined price ID to avoid creating duplicate products
    // This prevents multiple products being created for each subscription
    const ANNUAL_PRICE_ID = await getOrCreateAnnualPrice(stripe);
    
    // Prepare session configuration
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: ANNUAL_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        user_id: user.id,
        plan_type: "runner_annual",
        user_email: user.email,
        coupon_code: couponCode || "none"
      },
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/profile?tab=subscription`,
    };

    // Add coupon if provided and valid
    if (couponCode) {
      try {
        // Verify the coupon exists and is valid
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon && coupon.valid) {
          sessionConfig.discounts = [{
            coupon: couponCode
          }];
          log.info('Applied coupon to session', { couponCode, discountAmount: coupon.amount_off });
        } else {
          log.error('Invalid coupon provided', { couponCode });
          throw new Error(`Coupon ${couponCode} is not valid or has expired`);
        }
      } catch (error) {
        log.error('Coupon validation failed', { couponCode, error: error.message });
        throw new Error(`Invalid coupon code: ${couponCode}`);
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    log.info('Subscription session created successfully', {
      sessionId: session.id,
      userEmail: user.email,
      customerId: customerId || 'new',
      couponCode: couponCode || 'none'
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log.error('Subscription creation failed', {
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

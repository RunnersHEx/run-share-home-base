import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

// Helper function to get or create prices for different coupon tiers
async function getOrCreatePrice(stripe: any, couponCode: string): Promise<string> {
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

    // Determine price based on coupon code
    let targetAmount: number;
    let nickname: string;
    
    switch (couponCode?.toUpperCase()) {
      case 'FRIENDS15':
        targetAmount = 1500; // €15.00
        nickname = 'Friends Discount - €15';
        break;
      case 'LAUNCH35':
        targetAmount = 3500; // €35.00  
        nickname = 'Launch Discount - €35';
        break;
      default:
        targetAmount = 5900; // €59.00
        nickname = 'Regular Annual Membership';
    }

    // Check if price already exists for this amount
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100
    });

    const existingPrice = existingPrices.data.find((p: any) => 
      p.unit_amount === targetAmount && 
      p.currency === "eur" && 
      p.recurring?.interval === "year"
    );

    if (existingPrice) {
      log.info("Found existing price", { 
        priceId: existingPrice.id, 
        amount: targetAmount,
        couponCode 
      });
      return existingPrice.id;
    } else {
      // Create the price for this tier
      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: targetAmount,
        recurring: {
          interval: "year",
          interval_count: 1,
        },
        product: productId,
        nickname: nickname,
        metadata: {
          plan_type: "runner_annual",
          coupon_code: couponCode || 'none',
          original_price: '5900',
          points_awarded: "30_new_50_renewal"
        }
      });

      log.info("Created new price", { 
        priceId: price.id, 
        amount: targetAmount,
        couponCode 
      });
      return price.id;
    }
  } catch (error) {
    log.error("Failed to get/create price", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to get registration data and coupon code
    const body = await req.json();
    const { couponCode, registrationData } = body;

    log.info('Creating subscription session with registration data', { 
      email: registrationData?.email,
      couponCode: couponCode || 'none',
      hasRegistrationData: !!registrationData
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get the appropriate price ID based on coupon code
    const PRICE_ID = await getOrCreatePrice(stripe, couponCode);
    
    // Prepare session configuration (no longer using coupons - price is already discounted)
    const sessionConfig: any = {
      customer_email: registrationData?.email,
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        // Include all registration data except reCAPTCHA token (which is 1500+ chars and not needed for account creation)
        email: registrationData.email || '',
        password: registrationData.password || '',
        firstName: registrationData.firstName || '',
        lastName: registrationData.lastName || '',
        phone: registrationData.phone || '',
        birthDate: registrationData.birthDate || '',
        bio: registrationData.bio || '',
        runningExperience: registrationData.runningExperience || '',
        runningModalities: JSON.stringify(registrationData.runningModalities || []),
        preferredDistances: JSON.stringify(registrationData.preferredDistances || []),
        personalRecords: JSON.stringify(registrationData.personalRecords || {}),
        racesCompletedThisYear: (registrationData.racesCompletedThisYear || 0).toString(),
        emergencyContactName: registrationData.emergencyContactName || '',
        emergencyContactPhone: registrationData.emergencyContactPhone || '',
        isHost: (registrationData.isHost || false).toString(),
        isGuest: (registrationData.isGuest || false).toString(),
        // recaptchaToken excluded - it's the 1593-char culprit and not needed after payment
        coupon_code: couponCode || "none",
        plan_type: "runner_annual",
        createAccount: "true" // Critical flag for webhook to create new account
      },
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/auth?mode=register`,
    };
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    log.info('Subscription session created successfully with registration data', {
      sessionId: session.id,
      email: registrationData?.email,
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

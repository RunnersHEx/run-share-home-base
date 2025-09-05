import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get current date to check coupon validity
    const now = new Date();

    // Define the available coupons with their details
    const availableCoupons = [
      {
        code: "FRIENDS15",
        name: "Friends Launch Offer",
        description: "Special launch offer for friends",
        originalPrice: 59,
        discountedPrice: 15,
        validUntil: "2025-09-20",
        isActive: now <= new Date("2025-09-20T23:59:59Z"),
        type: "friends"
      },
      {
        code: "LAUNCH35", 
        name: "General Launch Offer",
        description: "Limited time launch discount", 
        originalPrice: 59,
        discountedPrice: 35,
        validUntil: "2025-11-30",
        isActive: now <= new Date("2025-11-30T23:59:59Z"),
        type: "general"
      }
    ];

    // Filter only active coupons
    const activeCoupons = availableCoupons.filter(coupon => coupon.isActive);

    // Verify with Stripe that these coupons actually exist and are valid
    const verifiedCoupons = [];
    
    for (const coupon of activeCoupons) {
      try {
        const stripeCoupon = await stripe.coupons.retrieve(coupon.code);
        if (stripeCoupon && stripeCoupon.valid) {
          verifiedCoupons.push({
            ...coupon,
            stripeData: {
              id: stripeCoupon.id,
              valid: stripeCoupon.valid,
              created: stripeCoupon.created,
              redeem_by: stripeCoupon.redeem_by,
              max_redemptions: stripeCoupon.max_redemptions,
              times_redeemed: stripeCoupon.times_redeemed
            }
          });
        }
      } catch (error) {
        console.log(`Coupon ${coupon.code} not found in Stripe or invalid:`, error.message);
        // Don't include invalid coupons
      }
    }

    return new Response(JSON.stringify({ 
      coupons: verifiedCoupons,
      currentDate: now.toISOString(),
      message: verifiedCoupons.length === 0 ? "No active coupons available" : `${verifiedCoupons.length} active coupons found`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch coupons",
      coupons: [],
      message: "Error retrieving coupon information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

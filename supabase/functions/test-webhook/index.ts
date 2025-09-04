import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    const responseData = {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      hasSignature: !!signature,
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
      environment: {
        hasStripeKey: !!Deno.env.get("STRIPE_SECRET_KEY"),
        hasWebhookSecret: !!Deno.env.get("STRIPE_WEBHOOK_SECRET"),
        supabaseUrl: !!Deno.env.get("SUPABASE_URL"),
        serviceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      }
    };
    
    console.log("TEST WEBHOOK RECEIVED:", JSON.stringify(responseData, null, 2));
    
    return new Response(JSON.stringify({ 
      received: true, 
      debug: responseData 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("TEST WEBHOOK ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message || String(error) 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Helper function to handle new account creation with subscription
async function handleNewAccountWithSubscription(session: any, stripe: any, supabaseClient: any) {
  const registrationData = session.metadata;
  
  logStep("🆕 Creating new account with subscription", {
    email: registrationData.email,
    couponCode: registrationData.coupon_code
  });
  
  try {
    // First, create the user account using Supabase Admin API
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: registrationData.email,
      password: registrationData.password,
      email_confirm: true, // Auto-confirm email since payment was successful
    });

    if (authError || !authData.user) {
      logStep("❌ Failed to create user account", authError);
      throw new Error(`Account creation failed: ${authError?.message}`);
    }

    const userId = authData.user.id;
    logStep("✅ User account created successfully", { userId, email: registrationData.email });

    // Create user profile with registration data
    // Set default values for fields that have database constraints
    
    // Map Spanish running experience values to English (database constraint requirement)
    const mapRunningExperience = (spanishValue: string): string => {
      const experienceMap: { [key: string]: string } = {
        'principiante': 'beginner',
        'intermedio': 'intermediate', 
        'avanzado': 'advanced',
        'experto': 'expert',
        'elite': 'elite'
      };
      return experienceMap[spanishValue?.toLowerCase()] || 'beginner';
    };
    
    const profileData = {
      id: userId,
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      email: registrationData.email,
      phone: registrationData.phone,
      birth_date: registrationData.birthDate,
      bio: registrationData.bio || 'Nuevo runner en RunnersHEx',
      running_experience: mapRunningExperience(registrationData.runningExperience),
      running_modalities: JSON.parse(registrationData.runningModalities || '["Ruta/Asfalto"]'),
      preferred_distances: JSON.parse(registrationData.preferredDistances || '["5K"]'),
      personal_records: JSON.parse(registrationData.personalRecords || '{}'),
      races_completed_this_year: parseInt(registrationData.racesCompletedThisYear || '0'),
      emergency_contact_name: registrationData.emergencyContactName,
      emergency_contact_phone: registrationData.emergencyContactPhone,
      is_host: registrationData.isHost === 'true',
      is_guest: registrationData.isGuest === 'true'
    };

    logStep("Profile data prepared with defaults", {
      originalRunningExperience: registrationData.runningExperience,
      mappedRunningExperience: profileData.running_experience,
      hasRunningModalities: profileData.running_modalities.length > 0,
      hasPreferredDistances: profileData.preferred_distances.length > 0
    });

    // Check if profile already exists before creating
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      logStep("Profile already exists, skipping creation", { userId });
    } else {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        logStep("❌ Failed to create user profile", profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      logStep("✅ User profile created successfully");
    }

    // Now create the subscription (reuse existing logic)
    await createSubscriptionForUser(userId, session, stripe, supabaseClient);
    
  } catch (error) {
    logStep("❌ Error in new account creation process", error);
    throw error;
  }
}

// Helper function to handle existing user subscription
async function handleExistingUserSubscription(session: any, stripe: any, supabaseClient: any) {
  const userId = session.metadata.user_id;
  logStep("🔄 Processing subscription for existing user", { userId });
  
  try {
    logStep("🔍 STEP 1: About to call createSubscriptionForUser", { userId });
    await createSubscriptionForUser(userId, session, stripe, supabaseClient);
    logStep("✅ STEP 2: createSubscriptionForUser completed successfully", { userId });
  } catch (error) {
    logStep("❌ ERROR in createSubscriptionForUser", { error, userId });
    throw error;
  }
  
  // REACTIVATION LOGIC: Check if user needs reactivation after subscription creation
  logStep("🔄 STEP 3: Starting reactivation check", { userId });
  logStep("🔄 REACTIVATION: Checking if user needs reactivation", { userId });
  
  try {
    // Get current user profile state
    const { data: currentProfile, error: profileFetchError } = await supabaseClient
      .from('profiles')
      .select('points_balance, is_active')
      .eq('id', userId)
      .single();
      
    if (profileFetchError) {
      logStep("❌ REACTIVATION ERROR: Could not fetch current profile", profileFetchError);
      return;
    }
    
    const currentPoints = currentProfile?.points_balance || 0;
    const isCurrentlyActive = currentProfile?.is_active;
    
    logStep("🔄 REACTIVATION: Current user state", {
      userId,
      currentPoints,
      isCurrentlyActive,
      needsReactivation: !isCurrentlyActive
    });
    
    // If user is inactive, reactivate them
    if (!isCurrentlyActive) {
      logStep("🔄 REACTIVATION: User is inactive - proceeding with reactivation");
      
      // Reactivate user profile with bonus points
      const { error: reactivationError } = await supabaseClient
        .from('profiles')
        .update({ 
          is_active: true,
          points_balance: currentPoints + 50 // Add reactivation bonus
        })
        .eq('id', userId);
        
      if (reactivationError) {
        logStep("❌ REACTIVATION ERROR: Could not reactivate user profile", reactivationError);
        return;
      }
      
      logStep("✅ REACTIVATION: User profile reactivated successfully", {
        userId,
        previousPoints: currentPoints,
        newPoints: currentPoints + 50,
        previousActiveStatus: isCurrentlyActive,
        newActiveStatus: true
      });
      
      // Reactivate user's properties and races
      const { error: propertyError } = await supabaseClient
        .from('properties')
        .update({ is_active: true })
        .eq('owner_id', userId);
        
      if (propertyError) {
        logStep("⚠️ REACTIVATION: Could not reactivate properties", propertyError);
      } else {
        logStep("✅ REACTIVATION: User properties reactivated");
      }
      
      const { error: raceError } = await supabaseClient
        .from('races')
        .update({ is_active: true })
        .eq('host_id', userId);
        
      if (raceError) {
        logStep("⚠️ REACTIVATION: Could not reactivate races", raceError);
      } else {
        logStep("✅ REACTIVATION: User races reactivated");
      }
      
      // Record reactivation points transaction
      const { error: pointsError } = await supabaseClient
        .from('points_transactions')
        .insert({
          user_id: userId,
          amount: 50,
          type: 'subscription_bonus',
          description: 'Puntos de bonificación por reactivación de suscripción'
        });
        
      if (pointsError) {
        logStep("⚠️ REACTIVATION: Could not record points transaction", pointsError);
      } else {
        logStep("✅ REACTIVATION: Points transaction recorded");
      }
      
      // Send reactivation notification
      const { error: notificationError } = await supabaseClient
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'subscription_reactivated',
          title: 'Suscripción reactivada',
          message: 'Tu suscripción ha sido reactivada exitosamente. ¡Bienvenido de vuelta!',
          data: {
            reactivation_date: new Date().toISOString(),
            points_awarded: 50
          }
        });
        
      if (notificationError) {
        logStep("⚠️ REACTIVATION: Could not create notification", notificationError);
      } else {
        logStep("✅ REACTIVATION: Notification created");
      }
      
      logStep("🎆 REACTIVATION: Complete reactivation process finished successfully", {
        userId,
        pointsAwarded: 50,
        reactivationDate: new Date().toISOString()
      });
      
    } else {
      logStep("ℹ️ REACTIVATION: User is already active - no reactivation needed", { userId });
    }
    
  } catch (error) {
    logStep("❌ REACTIVATION ERROR: Exception during reactivation process", error);
  }
}

// Common function to create subscription for a user
async function createSubscriptionForUser(userId: string, session: any, stripe: any, supabaseClient: any) {
  const planType = session.metadata.plan_type || "runner_annual";
  const userEmail = session.metadata.email || session.customer_email;
  const couponCode = session.metadata.coupon_code || "none";
  
  logStep("Creating subscription for user", { userId, planType, email: userEmail, couponCode });

  // Get actual subscription data from Stripe
  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;
  let stripeSubscriptionData = null;
  
  if (session.subscription) {
    try {
      stripeSubscriptionData = await stripe.subscriptions.retrieve(session.subscription as string);
      currentPeriodStart = new Date(stripeSubscriptionData.current_period_start * 1000);
      currentPeriodEnd = new Date(stripeSubscriptionData.current_period_end * 1000);
      
      logStep("✅ Retrieved actual period dates from Stripe", {
        subscriptionId: stripeSubscriptionData.id,
        status: stripeSubscriptionData.status,
        start: currentPeriodStart.toISOString(),
        end: currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: stripeSubscriptionData.cancel_at_period_end
      });
    } catch (stripeError) {
      logStep("⚠️ Could not retrieve Stripe subscription, using fallback dates", stripeError);
      // Use creation date as fallback
      const createdAt = new Date(session.created * 1000);
      currentPeriodStart = new Date(createdAt);
      currentPeriodEnd = new Date(createdAt);
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      
      logStep("📅 Using fallback dates based on session creation", {
        sessionCreated: createdAt.toISOString(),
        fallbackStart: currentPeriodStart.toISOString(),
        fallbackEnd: currentPeriodEnd.toISOString()
      });
    }
  } else {
    logStep("⚠️ No subscription ID in session, using fallback dates");
    // Use session creation date as base
    const createdAt = new Date(session.created * 1000);
    currentPeriodStart = new Date(createdAt);
    currentPeriodEnd = new Date(createdAt);
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    
    logStep("📅 Fallback dates set", {
      start: currentPeriodStart.toISOString(),
      end: currentPeriodEnd.toISOString()
    });
  }

  // Check if user already has a subscription
  const { data: existingSubscription } = await supabaseClient
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  logStep("Existing subscription check", { 
    found: !!existingSubscription,
    existingId: existingSubscription?.id 
  });

  // Get coupon information if discount was applied
  let couponDetails = null;
  if (session.total_details?.amount_discount && session.total_details.amount_discount > 0) {
    logStep("Discount detected in session", {
      amountDiscount: session.total_details.amount_discount,
      discountDescriptions: session.total_details.breakdown?.discounts
    });
    
    // Try to get coupon details from the session or subscription
    if (stripeSubscriptionData && stripeSubscriptionData.discount) {
      try {
        const couponData = stripeSubscriptionData.discount.coupon;
        couponDetails = {
          coupon_code: couponData.id,
          discount_amount: session.total_details.amount_discount,
          coupon_name: couponData.name || couponData.id,
          coupon_type: couponData.amount_off ? 'amount' : 'percent',
          coupon_value: couponData.amount_off || couponData.percent_off
        };
        logStep("✅ Coupon details extracted", couponDetails);
      } catch (error) {
        logStep("⚠️ Could not extract coupon details", error);
      }
    }
  }

  const subscriptionData = {
    email: userEmail!,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    plan_name: 'Membresía Runners HEx',
    plan_type: planType,
    status: 'active',
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    coupon_code: couponCode !== "none" ? couponCode : null,
    discount_amount: couponDetails?.discount_amount || null
  };
  
  logStep("Subscription data to save", {
    ...subscriptionData,
    userId: existingSubscription ? 'updating' : userId
  });
  
  let subscriptionOperation;
  
  if (existingSubscription) {
    logStep("📝 Updating existing subscription");
    subscriptionOperation = await supabaseClient
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)
      .select();
  } else {
    logStep("➕ Creating new subscription");
    subscriptionOperation = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        ...subscriptionData
      })
      .select();
  }
  
  if (subscriptionOperation.error) {
    logStep("❌ ERROR creating/updating subscription", subscriptionOperation.error);
    throw new Error(`Failed to create/update subscription: ${subscriptionOperation.error.message}`);
  }
  
  const subscription = subscriptionOperation.data?.[0];
  if (subscription) {
    logStep("✅ Subscription created/updated successfully", {
      subscriptionId: subscription.id,
      status: subscription.status,
      planType: subscription.plan_type
    });
    
    // Record payment in subscription_payments table
    // Get the actual amount paid from Stripe (includes discounts)
    let actualAmountPaid = 5900; // Default fallback to €59.00 in cents
    
    // Try to get actual amount from session data
    if (session.amount_total !== undefined && session.amount_total !== null) {
      actualAmountPaid = session.amount_total;
      logStep("Using actual amount from session", { 
        sessionAmountTotal: session.amount_total, 
        amountInEuros: session.amount_total / 100 
      });
    } else if (stripeSubscriptionData && stripeSubscriptionData.items?.data[0]?.price?.unit_amount) {
      // Fallback: get from subscription item price and apply discount if any
      const originalAmount = stripeSubscriptionData.items.data[0].price.unit_amount;
      const discountAmount = couponDetails?.discount_amount || 0;
      actualAmountPaid = originalAmount - discountAmount;
      logStep("Calculated amount from subscription data", { 
        originalAmount, 
        discountAmount, 
        finalAmount: actualAmountPaid,
        amountInEuros: actualAmountPaid / 100 
      });
    } else {
      logStep("⚠️ Using fallback amount - could not determine actual payment", { 
        fallbackAmount: actualAmountPaid,
        amountInEuros: actualAmountPaid / 100 
      });
    }
    
    const paymentData = {
      subscription_id: subscription.id,
      stripe_payment_intent_id: null, // Will be populated on future payments
      stripe_invoice_id: null, // Will be populated on future invoices
      amount: actualAmountPaid, // Use actual amount paid (including discounts)
      currency: 'eur',
      status: 'succeeded',
      payment_date: new Date().toISOString()
    };
    
    const { error: paymentError } = await supabaseClient
      .from('subscription_payments')
      .insert(paymentData);
      
    if (paymentError) {
      logStep("⚠️ Failed to record payment", paymentError);
    } else {
      logStep("✅ Payment recorded successfully");
    }
    
    logStep("🎆 Subscription processing completed successfully");
  } else {
    logStep("❌ ERROR: No subscription data returned after creation/update");
  }
}

serve(async (req) => {
  // Log ALL incoming requests with enhanced debugging
  const requestHeaders = Object.fromEntries(req.headers.entries());
  logStep("=== WEBHOOK CALLED ===", {
    method: req.method,
    url: req.url,
    userAgent: requestHeaders['user-agent'],
    contentType: requestHeaders['content-type'],
    hasStripeSignature: !!requestHeaders['stripe-signature'],
    allHeaders: requestHeaders
  });

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook request details", { 
      hasSignature: !!signature,
      bodyLength: body.length,
      contentType: req.headers.get("content-type"),
      bodyPreview: body.substring(0, 200),
      webhookCallSource: req.headers.get("user-agent") || "unknown"
    });
    
    if (!signature) {
      logStep("ERROR: Missing stripe-signature header", {
        availableHeaders: Object.keys(requestHeaders),
        userAgent: requestHeaders['user-agent'],
        potentialDirectCall: !requestHeaders['user-agent']?.includes('Stripe')
      });
      
      // Enhanced error message for debugging
      return new Response(JSON.stringify({ 
        error: "Missing stripe-signature header",
        details: {
          message: "This endpoint requires a valid Stripe signature header",
          availableHeaders: Object.keys(requestHeaders),
          userAgent: requestHeaders['user-agent'],
          timestamp: new Date().toISOString(),
          possibleCauses: [
            "Webhook URL not configured in Stripe dashboard",
            "Direct call to webhook endpoint (not from Stripe)",
            "Wrong environment variables (test vs live)",
            "Proxy/CDN stripping headers"
          ],
          nextSteps: [
            "Check Stripe Dashboard > Webhooks configuration",
            "Ensure webhook URL points to this exact endpoint",
            "Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard",
            "Test webhook from Stripe dashboard"
          ]
        }
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Check environment variables first
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not set");
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY environment variable is not set" 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not set");
      return new Response(JSON.stringify({ 
        error: "STRIPE_WEBHOOK_SECRET environment variable is not set" 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    logStep("Environment variables verified", { 
      hasSecretKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      secretKeyPrefix: stripeSecretKey.substring(0, 7),
      webhookSecretPrefix: webhookSecret.substring(0, 8)
    });

    const stripe = new Stripe(stripeSecretKey, { 
      apiVersion: "2023-10-16" 
    });

    logStep("Attempting to verify webhook signature...");
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    logStep("✅ Event verified successfully", { 
      type: event.type, 
      id: event.id,
      created: event.created,
      objectType: event.data.object.object
    });

    // Log the full event for debugging
    logStep("Full event data", {
      eventType: event.type,
      eventId: event.id,
      objectId: event.data.object.id,
      objectData: event.data.object
    });

    // Add specific logging for subscription events
    if (event.type.includes('subscription')) {
      logStep(`🔍 SUBSCRIPTION EVENT DETECTED: ${event.type}`, {
        subscriptionId: event.data.object.id,
        status: event.data.object.status,
        cancelAtPeriodEnd: event.data.object.cancel_at_period_end,
        currentPeriodEnd: event.data.object.current_period_end,
        customerId: event.data.object.customer
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        logStep("🎯 Processing checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;
        
        logStep("Session details", {
          sessionId: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
          subscriptionId: session.subscription,
          customerId: session.customer,
          metadata: session.metadata
        });
        
        if (session.mode === "subscription") {
          // Check if this is a new account registration (createAccount flag in metadata)
          if (session.metadata?.createAccount === "true") {
            logStep("🆕 Processing new account registration with subscription from checkout.session.completed");
            await handleNewAccountWithSubscription(session, stripe, supabaseClient);
          } else if (session.metadata?.user_id) {
            // Existing user subscription (original logic)
            logStep("🔄 Processing existing user subscription from checkout.session.completed");
            await handleExistingUserSubscription(session, stripe, supabaseClient);
          } else {
            logStep("⚠️ Subscription session without user_id or createAccount flag", {
              metadata: session.metadata
            });
          }
        } else {
          logStep("ℹ️ checkout.session.completed but not subscription mode", {
            mode: session.mode
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        logStep("🔄 Processing customer.subscription.updated");
        const subscription = event.data.object as Stripe.Subscription;
        
        // Enhanced logging to understand what's happening
        logStep("Subscription update details", {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: subscription.current_period_end,
          canceledAt: subscription.canceled_at
        });
        
        // Determine the actual status based on Stripe's subscription state
        let actualStatus = subscription.status;
        
        // If subscription is set to cancel at period end, mark as canceled in our system
        if (subscription.cancel_at_period_end && subscription.status === 'active') {
          actualStatus = 'canceled';
          logStep("Subscription marked for cancellation at period end - updating status to canceled");
        } else if (subscription.canceled_at) {
          actualStatus = 'canceled';
          logStep("Subscription has been canceled - updating status to canceled");
        }
        
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: actualStatus,
            current_period_start: subscription.current_period_start ? 
              new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: subscription.current_period_end ? 
              new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep("❌ ERROR updating subscription", error);
        } else {
          logStep("✅ Subscription updated successfully", {
            subscriptionId: subscription.id,
            oldStatus: subscription.status,
            newStatus: actualStatus,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            periodStart: subscription.current_period_start ? 
              new Date(subscription.current_period_start * 1000).toISOString() : null,
            periodEnd: subscription.current_period_end ? 
              new Date(subscription.current_period_end * 1000).toISOString() : null
          });
          
          // If subscription was marked as canceled, handle the cancellation logic
          if (actualStatus === 'canceled') {
            logStep("Processing cancellation logic for subscription update");
            
            // Get user details for cancellation handling
            const { data: subscriptionData } = await supabaseClient
              .from('subscriptions')
              .select('id, user_id, email')
              .eq('stripe_subscription_id', subscription.id)
              .single();
              
            if (subscriptionData) {
              const userId = subscriptionData.user_id;
              const currentPeriodEnd = subscription.current_period_end ? 
                new Date(subscription.current_period_end * 1000) : new Date();
              const now = new Date();
              const isImmediateCancellation = currentPeriodEnd <= now;
              
              if (isImmediateCancellation) {
                logStep("Processing immediate cancellation from subscription update");
                
                // Deactivate user immediately
                await supabaseClient
                  .from('profiles')
                  .update({ is_active: false, points_balance: 0 })
                  .eq('id', userId);
                  
                // Deactivate properties and races
                await supabaseClient
                  .from('properties')
                  .update({ is_active: false })
                  .eq('owner_id', userId);
                  
                await supabaseClient
                  .from('races')
                  .update({ is_active: false })
                  .eq('host_id', userId);
                  
                logStep("User deactivated due to immediate cancellation");
              } else {
                logStep("Subscription will cancel at period end - user keeps access");
                
                // Add notification about upcoming cancellation
                await supabaseClient
                  .from('user_notifications')
                  .insert({
                    user_id: userId,
                    type: 'subscription_cancellation',
                    title: 'Suscripción cancelada',
                    message: `Tu suscripción se cancelará el ${currentPeriodEnd.toLocaleDateString('es-ES')}. Podrás usar la plataforma hasta entonces.`,
                    data: {
                      cancellation_date: currentPeriodEnd.toISOString(),
                      subscription_id: subscriptionData.id
                    }
                  });
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        logStep("❌ Processing customer.subscription.deleted");
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get subscription details from database to understand the user impact
        const { data: subscriptionData, error: fetchError } = await supabaseClient
          .from('subscriptions')
          .select('id, user_id, email, plan_type, current_period_end, points_balance')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (fetchError || !subscriptionData) {
          logStep("⚠️ Could not find subscription in database", { 
            stripeSubscriptionId: subscription.id,
            error: fetchError 
          });
          
          // Try to update by stripe_subscription_id anyway (basic fallback)
          const { error: basicUpdateError } = await supabaseClient
            .from('subscriptions')
            .update({ 
              status: 'canceled',
              current_period_end: subscription.current_period_end ? 
                new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
            
          if (basicUpdateError) {
            logStep("❌ Basic status update also failed", basicUpdateError);
          } else {
            logStep("✅ Basic status update succeeded");
          }
          break;
        }
        
        const userId = subscriptionData.user_id;
        const currentPeriodEnd = subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000) : new Date();
        const now = new Date();
        const isImmediateCancellation = currentPeriodEnd <= now;
        
        logStep("Subscription cancellation details", {
          subscriptionId: subscription.id,
          userId: userId,
          email: subscriptionData.email,
          planType: subscriptionData.plan_type,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          isImmediateCancellation,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        
        // Update subscription status
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            current_period_end: currentPeriodEnd.toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (updateError) {
          logStep("❌ ERROR updating subscription status", updateError);
          break;
        }
        
        // Handle immediate vs end-of-period cancellation
        if (isImmediateCancellation) {
          logStep("🚫 Processing immediate subscription cancellation");
          
          // Deactivate user immediately (lose access to premium features)
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ 
              is_active: false,
              // Reset points balance to 0 on immediate cancellation
              points_balance: 0
            })
            .eq('id', userId);
            
          if (profileError) {
            logStep("⚠️ Could not deactivate user profile", profileError);
          } else {
            logStep("✅ User profile deactivated immediately");
          }
          
          // Cancel any pending bookings as guest (since they can't afford them without subscription)
          const { error: bookingError } = await supabaseClient
            .from('bookings')
            .update({ 
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('guest_id', userId)
            .in('status', ['pending', 'accepted']);
            
          if (bookingError) {
            logStep("⚠️ Could not cancel pending bookings", bookingError);
          } else {
            logStep("✅ Pending bookings cancelled");
          }
          
          // Deactivate user's properties and races (can't host without subscription)
          const { error: propertyError } = await supabaseClient
            .from('properties')
            .update({ is_active: false })
            .eq('owner_id', userId);
            
          if (propertyError) {
            logStep("⚠️ Could not deactivate properties", propertyError);
          } else {
            logStep("✅ User properties deactivated");
          }
          
          const { error: raceError } = await supabaseClient
            .from('races')
            .update({ is_active: false })
            .eq('host_id', userId);
            
          if (raceError) {
            logStep("⚠️ Could not deactivate races", raceError);
          } else {
            logStep("✅ User races deactivated");
          }
          
        } else {
          logStep("📅 Processing end-of-period cancellation");
          
          // User keeps access until period end, but no new premium actions
          // Add notification to inform user of upcoming cancellation
          const { error: notificationError } = await supabaseClient
            .from('user_notifications')
            .insert({
              user_id: userId,
              type: 'subscription_cancellation',
              title: 'Suscripción cancelada',
              message: `Tu suscripción se cancelará el ${currentPeriodEnd.toLocaleDateString('es-ES')}. Podrás usar la plataforma hasta entonces.`,
              data: {
                cancellation_date: currentPeriodEnd.toISOString(),
                subscription_id: subscriptionData.id
              }
            });
            
          if (notificationError) {
            logStep("⚠️ Could not create cancellation notification", notificationError);
          } else {
            logStep("✅ Cancellation notification created");
          }
        }
        
        // Record the cancellation event in points transactions
        const { error: transactionError } = await supabaseClient
          .from('points_transactions')
          .insert({
            user_id: userId,
            amount: isImmediateCancellation ? -subscriptionData.points_balance || 0 : 0,
            type: 'subscription_cancellation',
            description: isImmediateCancellation ? 
              'Puntos perdidos por cancelación inmediata de suscripción' : 
              'Suscripción cancelada - acceso hasta fin de periodo'
          });
          
        if (transactionError) {
          logStep("⚠️ Could not record cancellation transaction", transactionError);
        } else {
          logStep("✅ Cancellation transaction recorded");
        }
        
        logStep("✅ Subscription cancellation processing completed", {
          subscriptionId: subscription.id,
          userId: userId,
          cancellationType: isImmediateCancellation ? 'immediate' : 'end_of_period',
          effectiveDate: currentPeriodEnd.toISOString()
        });
        
        break;
      }

      case "invoice.payment_succeeded": {
        logStep("🎯 Processing invoice.payment_succeeded (potential renewal)");
        const invoice = event.data.object as Stripe.Invoice;
        
        logStep("📋 DETAILED Invoice analysis", {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid,
          billingReason: invoice.billing_reason,
          invoiceStatus: invoice.status,
          paymentIntent: invoice.payment_intent,
          created: invoice.created
        });
        
        // Check if this is an initial subscription payment (not renewal)
        if (invoice.billing_reason === 'subscription_create' && invoice.subscription) {
          logStep("🆕 Detected initial subscription payment - checking for registration data");
          
          try {
            // Get the subscription to access metadata
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            logStep("Subscription metadata check", {
              subscriptionId: stripeSubscription.id,
              hasMetadata: !!stripeSubscription.metadata,
              metadata: stripeSubscription.metadata
            });
            
            // Check if this is truly a new account creation (not a renewal with old metadata)
            // First verify if user already exists in our database
            const email = stripeSubscription.metadata?.email;
            logStep("USER EXISTENCE CHECK", {
              hasEmail: !!email,
              email: email,
              metadata: stripeSubscription.metadata
            });
            
            if (email) {
              logStep("SEARCHING FOR EXISTING USER", { email });
              
              const { data: existingUser, error: userLookupError } = await supabaseClient
                .from('profiles')
                .select('id, email')
                .eq('email', email)
                .single();
                
              logStep("USER LOOKUP RESULT", {
                found: !!existingUser,
                userId: existingUser?.id,
                userEmail: existingUser?.email,
                error: userLookupError
              });
                
              if (existingUser) {
                logStep("User already exists - treating as existing user subscription", {
                  email,
                  userId: existingUser.id
                });
                
                // Handle as existing user subscription instead of creating new account
                const sessionLikeObject = {
                  id: `invoice_session_${invoice.id}`,
                  mode: "subscription",
                  subscription: stripeSubscription.id,
                  customer: stripeSubscription.customer,
                  metadata: { 
                    ...stripeSubscription.metadata,
                    user_id: existingUser.id // Add user_id for existing user flow
                  },
                  created: invoice.created
                };
                
                logStep("Processing as REACTIVATION for existing user", {
                  userId: existingUser.id,
                  email,
                  subscriptionId: stripeSubscription.id
                });
                
                await handleExistingUserSubscription(sessionLikeObject, stripe, supabaseClient);
                
                // REACTIVATION LOGIC: Since this is an existing user creating a new subscription after cancellation
                logStep("REACTIVATION: Processing user reactivation after new subscription creation");
                
                // Reactivate the user profile
                const { data: currentProfile, error: profileFetchError } = await supabaseClient
                  .from('profiles')
                  .select('points_balance, is_active')
                  .eq('id', existingUser.id)
                  .single();
                  
                if (!profileFetchError && currentProfile) {
                  const currentPoints = currentProfile.points_balance || 0;
                  const isCurrentlyActive = currentProfile.is_active;
                  
                  logStep("REACTIVATION: Current user state", {
                    userId: existingUser.id,
                    currentPoints,
                    isCurrentlyActive
                  });
                  
                  // Reactivate user profile with bonus points
                  const { error: reactivationError } = await supabaseClient
                    .from('profiles')
                    .update({ 
                      is_active: true,
                      points_balance: currentPoints + 50 // Add reactivation bonus
                    })
                    .eq('id', existingUser.id);
                    
                  if (!reactivationError) {
                    logStep("REACTIVATION: User profile reactivated successfully", {
                      userId: existingUser.id,
                      previousPoints: currentPoints,
                      newPoints: currentPoints + 50,
                      previousActiveStatus: isCurrentlyActive,
                      newActiveStatus: true
                    });
                    
                    // Reactivate user's properties and races
                    await supabaseClient
                      .from('properties')
                      .update({ is_active: true })
                      .eq('owner_id', existingUser.id);
                      
                    await supabaseClient
                      .from('races')
                      .update({ is_active: true })
                      .eq('host_id', existingUser.id);
                      
                    // Record reactivation points transaction
                    await supabaseClient
                      .from('points_transactions')
                      .insert({
                        user_id: existingUser.id,
                        amount: 50,
                        type: 'subscription_bonus',
                        description: 'Puntos de bonificación por reactivación de suscripción'
                      });
                      
                    // Send reactivation notification
                    await supabaseClient
                      .from('user_notifications')
                      .insert({
                        user_id: existingUser.id,
                        type: 'subscription_reactivated',
                        title: 'Suscripción reactivada',
                        message: 'Tu suscripción ha sido reactivada exitosamente. ¡Bienvenido de vuelta!',
                        data: {
                          reactivation_date: new Date().toISOString(),
                          points_awarded: 50
                        }
                      });
                      
                    logStep("REACTIVATION: Complete reactivation process finished successfully");
                  } else {
                    logStep("REACTIVATION ERROR: Could not reactivate user profile", reactivationError);
                  }
                } else {
                  logStep("REACTIVATION ERROR: Could not fetch current profile", profileFetchError);
                }
                
                return;
              }
            } else {
              logStep("NO EMAIL FOUND IN METADATA - will proceed with createAccount flag check", {
                hasCreateAccountFlag: stripeSubscription.metadata?.createAccount === "true"
              });
            }
            
            // If subscription has createAccount flag AND user doesn't exist, process new account creation
            if (stripeSubscription.metadata?.createAccount === "true") {
              logStep("🆕 Processing new account creation from invoice.payment_succeeded");
              
              // Create a session-like object for compatibility with existing logic
              const sessionLikeObject = {
                id: `invoice_session_${invoice.id}`,
                mode: "subscription",
                subscription: stripeSubscription.id,
                customer: stripeSubscription.customer,
                metadata: stripeSubscription.metadata,
                created: invoice.created
              };
              
              await handleNewAccountWithSubscription(sessionLikeObject, stripe, supabaseClient);
            } else {
              logStep("ℹ️ Initial payment but no createAccount flag - likely existing user subscription");
            }
          } catch (error) {
            logStep("❌ ERROR processing initial subscription payment", error);
          }
        } else {
          logStep("BILLING REASON ANALYSIS", {
            billingReason: invoice.billing_reason,
            expectedForRenewal: 'subscription_cycle',
            isRenewal: invoice.billing_reason === 'subscription_cycle',
            willProcess: invoice.billing_reason === 'subscription_cycle' && !!invoice.subscription
          });
        }
        
        // If this is a subscription renewal (not the initial payment)
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          logStep("🔄 Detected subscription renewal", {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amountPaid: invoice.amount_paid,
            billingReason: invoice.billing_reason
          });
          
          // Get the subscription from Stripe to update period dates
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            // Get user details for reactivation if needed
            const { data: subscriptionData } = await supabaseClient
              .from('subscriptions')
              .select('id, user_id, email, status')
              .eq('stripe_subscription_id', invoice.subscription)
              .single();
            
            if (!subscriptionData) {
              logStep("⚠️ Could not find subscription for renewal", {
                stripeSubscriptionId: invoice.subscription
              });
              return;
            }
            
            const userId = subscriptionData.user_id;
            
            logStep("🔄 Processing renewal for user", {
              userId,
              email: subscriptionData.email,
              currentDatabaseStatus: subscriptionData.status
            });
            
            // Update subscription with new period dates and ensure active status
            const { error: updateError } = await supabaseClient
              .from('subscriptions')
              .update({
                current_period_start: stripeSubscription.current_period_start ? 
                  new Date(stripeSubscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
                current_period_end: stripeSubscription.current_period_end ? 
                  new Date(stripeSubscription.current_period_end * 1000).toISOString() : new Date().toISOString(),
                status: 'active' // Ensure status is active on successful renewal
              })
              .eq('stripe_subscription_id', invoice.subscription);
              
            if (updateError) {
              logStep("❌ ERROR updating subscription on renewal", updateError);
              return;
            }
            
            logStep("✅ Subscription renewed successfully", {
              subscriptionId: invoice.subscription,
              newPeriodStart: stripeSubscription.current_period_start ? 
                new Date(stripeSubscription.current_period_start * 1000).toISOString() : null,
              newPeriodEnd: stripeSubscription.current_period_end ? 
                new Date(stripeSubscription.current_period_end * 1000).toISOString() : null
            });
            
            // Reactivate user if they were deactivated due to subscription issues
            logStep("STEP 1: Getting current user profile for reactivation", { userId });
            
            const { data: currentProfile, error: profileFetchError } = await supabaseClient
              .from('profiles')
              .select('points_balance, is_active')
              .eq('id', userId)
              .single();
              
            if (profileFetchError) {
              logStep("ERROR: Could not fetch current profile", profileFetchError);
              return;
            }
              
            const currentPoints = currentProfile?.points_balance || 0;
            const isCurrentlyActive = currentProfile?.is_active;
            
            logStep("STEP 2: Current user state", {
              userId,
              currentPoints,
              isCurrentlyActive,
              needsReactivation: !isCurrentlyActive
            });
            
            logStep("STEP 3: Attempting user profile reactivation");
            
            const { error: reactivationError } = await supabaseClient
              .from('profiles')
              .update({ 
                is_active: true,
                points_balance: currentPoints + 50 // Add renewal points to existing balance
              })
              .eq('id', userId);
              
            if (reactivationError) {
              logStep("ERROR: Could not reactivate user profile", reactivationError);
              return;
            } else {
              logStep("SUCCESS: User profile reactivated with renewal points", {
                userId,
                previousPoints: currentPoints,
                newPoints: currentPoints + 50,
                previousActiveStatus: isCurrentlyActive,
                newActiveStatus: true
              });
            }
            
            // Reactivate user's properties and races
            const { error: propertyError } = await supabaseClient
              .from('properties')
              .update({ is_active: true })
              .eq('owner_id', userId);
              
            if (propertyError) {
              logStep("⚠️ Could not reactivate properties", propertyError);
            } else {
              logStep("✅ User properties reactivated");
            }
            
            const { error: raceError } = await supabaseClient
              .from('races')
              .update({ is_active: true })
              .eq('host_id', userId);
              
            if (raceError) {
              logStep("⚠️ Could not reactivate races", raceError);
            } else {
              logStep("✅ User races reactivated");
            }
            
            // Record the renewal payment in subscription_payments table
            const renewalPaymentData = {
              subscription_id: subscriptionData.id,
              stripe_payment_intent_id: invoice.payment_intent as string || null,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid, // Use actual amount paid
              currency: invoice.currency || 'eur',
              status: 'succeeded',
              payment_date: new Date(invoice.created * 1000).toISOString()
            };
            
            const { error: paymentError } = await supabaseClient
              .from('subscription_payments')
              .insert(renewalPaymentData);
              
            if (paymentError) {
              logStep("⚠️ Failed to record renewal payment", paymentError);
            } else {
              logStep("✅ Renewal payment recorded successfully", {
                amount: invoice.amount_paid,
                amountInEuros: invoice.amount_paid / 100
              });
            }
            
            // Record renewal points transaction
            const { error: pointsTransactionError } = await supabaseClient
              .from('points_transactions')
              .insert({
                user_id: userId,
                amount: 50, // Renewal bonus points
                type: 'subscription_bonus',
                description: 'Puntos de bonificación por renovación de suscripción'
              });
              
            if (pointsTransactionError) {
              logStep("⚠️ Failed to record renewal points transaction", pointsTransactionError);
            } else {
              logStep("✅ Renewal points transaction recorded");
            }
            
            // Send renewal notification
            const { error: notificationError } = await supabaseClient
              .from('user_notifications')
              .insert({
                user_id: userId,
                type: 'subscription_renewed',
                title: 'Suscripción renovada',
                message: `Tu suscripción se ha renovado exitosamente. Tienes acceso hasta el ${new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString('es-ES')}.`,
                data: {
                  renewal_date: new Date().toISOString(),
                  period_end: stripeSubscription.current_period_end ? 
                    new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
                  points_awarded: 50
                }
              });
              
            if (notificationError) {
              logStep("⚠️ Could not create renewal notification", notificationError);
            } else {
              logStep("✅ Renewal notification created");
            }
            
            logStep("🎆 Subscription renewal processing completed successfully", {
              subscriptionId: invoice.subscription,
              userId: userId,
              amountPaid: invoice.amount_paid,
              pointsAwarded: 50,
              renewalDate: new Date().toISOString()
            });
            
          } catch (renewalError) {
            logStep("❌ ERROR processing renewal", renewalError);
          }
        } else {
          logStep("ℹ️ invoice.payment_succeeded with billing_reason", {
            billingReason: invoice.billing_reason,
            willSkip: "Not subscription_create or subscription_cycle"
          });
        }
        break;
      }

      default:
        logStep("ℹ️ Unhandled event type", { type: event.type });
    }

    logStep("🎉 Webhook processing completed successfully");
    return new Response(JSON.stringify({ 
      received: true,
      timestamp: new Date().toISOString(),
      eventType: event.type,
      processed: true
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Improved error handling for better debugging
    let errorMessage = 'Unknown error occurred';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
      errorDetails = error;
    } else {
      errorMessage = String(error);
      errorDetails = { rawError: error };
    }
    
    logStep("💥 ERROR processing webhook", { 
      errorMessage, 
      errorDetails,
      requestHeaders: Object.fromEntries(req.headers.entries()),
      hasSignature: !!signature,
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      requestId: `webhook_${Date.now()}`
    }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

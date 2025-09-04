-- Create subscribers table for Stripe subscription management
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan_type text NOT NULL DEFAULT 'runner_annual',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'unpaid')),
  subscription_start timestamp with time zone DEFAULT now(),
  subscription_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create subscription payments table for tracking payment history
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
  payment_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for subscription_payments  
CREATE POLICY "Users can view their own payment history" ON public.subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscribers s 
      WHERE s.id = subscriber_id AND s.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, UPDATE ON public.subscribers TO authenticated;
GRANT SELECT ON public.subscription_payments TO authenticated;

-- Service role needs full access for webhook
GRANT ALL ON public.subscribers TO service_role;
GRANT ALL ON public.subscription_payments TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription_id ON public.subscribers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscriber_id ON public.subscription_payments(subscriber_id);

-- Function to allocate subscription points (1200 for annual plan)
CREATE OR REPLACE FUNCTION allocate_subscription_points(
  p_user_id uuid,
  p_points integer,
  p_subscription_id uuid DEFAULT NULL,
  p_description text DEFAULT 'Subscription points allocation'
)
RETURNS void AS $$
BEGIN
  -- Add points to user's balance
  UPDATE profiles 
  SET points_balance = points_balance + p_points 
  WHERE id = p_user_id;
  
  -- Record the transaction
  INSERT INTO points_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_points, 'subscription_bonus', p_description);
  
  -- Log the allocation
  RAISE NOTICE 'Allocated % points to user %', p_points, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION allocate_subscription_points TO service_role;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscribers_updated_at();

-- Comments
COMMENT ON TABLE public.subscribers IS 'Stores Stripe subscription information for users';
COMMENT ON TABLE public.subscription_payments IS 'Tracks payment history for subscriptions';
COMMENT ON FUNCTION allocate_subscription_points IS 'Allocates subscription points to users when they subscribe or renew';

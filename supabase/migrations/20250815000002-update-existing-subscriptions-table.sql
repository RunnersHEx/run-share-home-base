-- Adjust existing subscriptions table for Stripe integration
-- Add missing fields needed for Stripe webhook processing

-- Add missing columns to existing subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'runner_annual';

-- Update status check constraint to include all Stripe statuses
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'canceled'::text, 'past_due'::text, 'expired'::text, 'unpaid'::text]));

-- Create subscription payments table for tracking payment history
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
  payment_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security for subscriptions (if not already enabled)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for subscription_payments  
DROP POLICY IF EXISTS "Users can view their own payment history" ON public.subscription_payments;
CREATE POLICY "Users can view their own payment history" ON public.subscription_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscription_payments TO authenticated;

-- Service role needs full access for webhook
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.subscription_payments TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON public.subscription_payments(subscription_id);

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

-- Update timestamp trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Comments
COMMENT ON TABLE public.subscription_payments IS 'Tracks payment history for subscriptions';
COMMENT ON FUNCTION allocate_subscription_points IS 'Allocates subscription points to users when they subscribe or renew';

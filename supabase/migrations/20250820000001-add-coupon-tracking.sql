-- Add coupon tracking columns to subscriptions table
-- This allows tracking which coupons were used and discount amounts

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount INTEGER; -- Store in cents like Stripe

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.coupon_code IS 'The coupon code used during subscription creation (e.g., FRIENDS15, LAUNCH35)';
COMMENT ON COLUMN subscriptions.discount_amount IS 'The discount amount applied in cents (e.g., 4400 for €44.00 discount)';

-- Create index for coupon analytics
CREATE INDEX IF NOT EXISTS idx_subscriptions_coupon_code ON subscriptions(coupon_code) WHERE coupon_code IS NOT NULL;

-- Update the existing constraint to include new status values if needed
DO $$
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'subscriptions_status_check'
    ) THEN
        ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'inactive', 'canceled', 'expired', 'unpaid', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'paused'));
END $$;

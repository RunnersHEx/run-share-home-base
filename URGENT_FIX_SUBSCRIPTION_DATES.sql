-- IMMEDIATE FIX FOR SUBSCRIPTION DATES
-- Run this in Supabase SQL Editor to fix the missing dates

-- Step 1: Check current state
SELECT 
  id,
  user_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  stripe_subscription_id
FROM public.subscriptions
ORDER BY created_at DESC;

-- Step 2: Fix missing dates (using creation date as start, +1 year as end)
UPDATE public.subscriptions 
SET 
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '1 year'
WHERE 
  current_period_start IS NULL 
  OR current_period_end IS NULL;

-- Step 3: Verify the fix
SELECT 
  id,
  user_id,
  status,
  current_period_start,
  current_period_end,
  created_at
FROM public.subscriptions
ORDER BY created_at DESC;

-- If you have Stripe subscription IDs and want more accurate dates, 
-- you'll need to get them from Stripe API manually

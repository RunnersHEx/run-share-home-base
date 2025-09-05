-- Manual SQL fix for subscription dates
-- Run this in your Supabase SQL Editor

-- Update subscriptions with missing dates
UPDATE public.subscriptions 
SET 
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '1 year'
WHERE 
  current_period_start IS NULL 
  OR current_period_end IS NULL;

-- Verify the fix worked
SELECT 
  id,
  user_id,
  status,
  current_period_start,
  current_period_end,
  created_at
FROM public.subscriptions
WHERE user_id IN (
  SELECT id FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 5
);

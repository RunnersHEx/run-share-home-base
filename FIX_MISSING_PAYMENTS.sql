-- MANUAL FIX FOR MISSING PAYMENT RECORDS
-- Run this in Supabase SQL Editor to add the missing payment

-- Step 1: Check current subscription and missing payments
SELECT 
  s.id as subscription_id,
  s.user_id,
  s.status,
  s.plan_type,
  s.created_at as subscription_created,
  COALESCE(COUNT(sp.id), 0) as payment_count
FROM public.subscriptions s
LEFT JOIN public.subscription_payments sp ON s.id = sp.subscription_id
GROUP BY s.id, s.user_id, s.status, s.plan_type, s.created_at
ORDER BY s.created_at DESC;

-- Step 2: Add missing payment record for active subscriptions without payments
-- (Assuming 59 EUR annual subscription based on your UI)
INSERT INTO public.subscription_payments (
  subscription_id,
  amount,
  currency,
  status,
  payment_date
)
SELECT 
  s.id,
  5900, -- 59 EUR in cents
  'eur',
  'succeeded',
  s.created_at -- Use subscription creation date as payment date
FROM public.subscriptions s
LEFT JOIN public.subscription_payments sp ON s.id = sp.subscription_id
WHERE s.status = 'active' 
  AND sp.id IS NULL -- No existing payment records
  AND s.created_at IS NOT NULL;

-- Step 3: Verify the payment records were created
SELECT 
  s.id as subscription_id,
  s.user_id,
  s.status,
  sp.amount,
  sp.currency,
  sp.status as payment_status,
  sp.payment_date
FROM public.subscriptions s
LEFT JOIN public.subscription_payments sp ON s.id = sp.subscription_id
ORDER BY s.created_at DESC;

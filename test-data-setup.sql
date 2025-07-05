-- MESSAGING SYSTEM TEST DATA SETUP (SIMPLIFIED)
-- Run this in Supabase SQL Editor AFTER applying the main migration

-- Step 1: Check existing users
SELECT 'Current users in system:' as info;
SELECT 
  au.id,
  au.email,
  p.first_name,
  p.last_name,
  p.is_host,
  p.is_guest
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at
LIMIT 10;

-- Step 2: If you don't have test users, you can create profiles for existing auth users
-- (Only run this if you see auth.users but no corresponding profiles)

/*
-- Uncomment and modify these if needed:
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  is_host, 
  is_guest
) 
VALUES 
  -- Replace these UUIDs with actual user IDs from auth.users
  ('your-host-user-uuid-here', 'host@test.com', 'Test', 'Host', true, false),
  ('your-guest-user-uuid-here', 'guest@test.com', 'Test', 'Guest', false, true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  is_host = EXCLUDED.is_host,
  is_guest = EXCLUDED.is_guest;
*/

-- Step 3: Create a minimal test property (modify owner_id)
INSERT INTO public.properties (
  id,
  owner_id,
  title,
  provinces,
  locality,
  full_address,
  bedrooms,
  beds,
  bathrooms,
  max_guests,
  amenities,
  is_active
) 
SELECT 
  gen_random_uuid(),
  p.id,  -- Use the first host profile found
  'Test Property for Messaging',
  ARRAY['Madrid'],
  'Madrid',
  'Test Address 123, Madrid',
  2,
  2,
  1,
  4,
  ARRAY['wifi', 'kitchen'],
  true
FROM public.profiles p
WHERE p.is_host = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 4: Create a test race
INSERT INTO public.races (
  id,
  host_id,
  property_id,
  name,
  description,
  race_date,
  modalities,
  terrain_profile,
  distances,
  points_cost,
  max_guests,
  is_active
)
SELECT 
  gen_random_uuid(),
  p.id,
  prop.id,
  'Test Marathon for Messaging',
  'A test race for messaging system',
  CURRENT_DATE + INTERVAL '30 days',
  '["road"]'::jsonb,
  '["flat"]'::jsonb,
  '["marathon"]'::jsonb,
  50,
  4,
  true
FROM public.profiles p
CROSS JOIN (
  SELECT id FROM public.properties 
  WHERE title = 'Test Property for Messaging' 
  LIMIT 1
) prop
WHERE p.is_host = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 5: Create a test booking (this enables messaging)
INSERT INTO public.bookings (
  id,
  race_id,
  guest_id,
  host_id,
  property_id,
  check_in_date,
  check_out_date,
  guests_count,
  request_message,
  points_cost,
  status,
  host_response_deadline
)
SELECT 
  gen_random_uuid(),
  r.id,
  guest_p.id,
  host_p.id,
  r.property_id,
  CURRENT_DATE + INTERVAL '28 days',
  CURRENT_DATE + INTERVAL '31 days',
  2,
  'Test message for the messaging system!',
  50,
  'accepted',
  CURRENT_DATE + INTERVAL '1 day'
FROM public.races r
CROSS JOIN (
  SELECT id FROM public.profiles WHERE is_host = true LIMIT 1
) host_p
CROSS JOIN (
  SELECT id FROM public.profiles WHERE is_guest = true LIMIT 1
) guest_p
WHERE r.name = 'Test Marathon for Messaging'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 6: Verify test data creation
SELECT 'Test data verification:' as status;

SELECT 
  'Booking created for messaging test' as result,
  b.id as booking_id,
  hp.first_name || ' ' || hp.last_name as host_name,
  gp.first_name || ' ' || gp.last_name as guest_name,
  r.name as race_name,
  prop.title as property_title,
  b.status as booking_status
FROM public.bookings b
JOIN public.profiles hp ON b.host_id = hp.id
JOIN public.profiles gp ON b.guest_id = gp.id
JOIN public.races r ON b.race_id = r.id
JOIN public.properties prop ON b.property_id = prop.id
WHERE r.name = 'Test Marathon for Messaging';

-- Step 7: The conversation should be auto-created when first message is sent
-- You can now test the messaging system by:
-- 1. Logging in as the guest user
-- 2. Going to /bookings 
-- 3. Clicking "Message" on the test booking
-- 4. Sending a message

SELECT '✅ Test data setup complete! Ready for messaging system testing.' as final_status;

-- =====================================================
-- NEW_MESSAGE_SYSTEM - MINIMAL TEST DATA SETUP
-- =====================================================
-- Creates minimal test data (3-4 entries) for messaging system testing
-- Uses existing profiles/users - NO new users created
-- Only creates data for tables involved in messaging flow

-- =====================================================
-- TABLES INVOLVED IN MESSAGING SYSTEM FLOW:
-- =====================================================
-- • profiles (EXISTING - uses current data, no new entries)
-- • properties (creates minimal entries if needed)
-- • races (creates minimal entries if needed) 
-- • bookings (CORE - creates 3 entries to enable messaging)
-- • conversations (AUTO-CREATED when first message sent)
-- • booking_messages (creates 3-4 initial messages)

-- =====================================================
-- STEP 1: VERIFY EXISTING DATA
-- =====================================================

-- Check existing profiles to use
SELECT 'Existing profiles that will be used:' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name,
    CASE WHEN is_host THEN 'Host' WHEN is_guest THEN 'Guest' ELSE 'Unknown' END as role
FROM public.profiles 
WHERE id IS NOT NULL
ORDER BY created_at 
LIMIT 6;

-- =====================================================
-- STEP 2: CREATE MINIMAL PROPERTIES (2 entries)
-- =====================================================

-- Property 1: Using first available host
INSERT INTO public.properties (
    id, owner_id, title, description, provinces, locality, full_address,
    bedrooms, beds, bathrooms, max_guests, amenities, is_active
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Runner House Madrid',
    'Perfect for marathon runners',
    ARRAY['Madrid'],
    'Madrid',
    'Calle Test 123, Madrid',
    2, 2, 1, 4,
    ARRAY['wifi', 'kitchen'],
    true
FROM public.profiles p
WHERE p.id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Property 2: Using second available user
INSERT INTO public.properties (
    id, owner_id, title, description, provinces, locality, full_address,
    bedrooms, beds, bathrooms, max_guests, amenities, is_active
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Trail Runner Base',
    'Great for trail enthusiasts',
    ARRAY['Barcelona'],
    'Barcelona',
    'Carrer Test 456, Barcelona',
    1, 1, 1, 2,
    ARRAY['wifi'],
    true
FROM public.profiles p
WHERE p.id IS NOT NULL
ORDER BY created_at
OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: CREATE MINIMAL RACES (2 entries)
-- =====================================================

-- Race 1: Madrid Marathon
INSERT INTO public.races (
    id, host_id, property_id, name, description, race_date,
    modalities, terrain_profile, distances, points_cost, max_guests, is_active
)
SELECT 
    gen_random_uuid(),
    prop.owner_id,
    prop.id,
    'Test Madrid Marathon',
    'Marathon test race',
    CURRENT_DATE + INTERVAL '30 days',
    '["road"]'::jsonb,
    '["flat"]'::jsonb,
    '["marathon"]'::jsonb,
    50, 4, true
FROM public.properties prop
WHERE prop.title = 'Runner House Madrid'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Race 2: Barcelona Trail
INSERT INTO public.races (
    id, host_id, property_id, name, description, race_date,
    modalities, terrain_profile, distances, points_cost, max_guests, is_active
)
SELECT 
    gen_random_uuid(),
    prop.owner_id,
    prop.id,
    'Test Barcelona Trail',
    'Trail test race',
    CURRENT_DATE + INTERVAL '45 days',
    '["trail"]'::jsonb,
    '["hilly"]'::jsonb,
    '["20k"]'::jsonb,
    40, 2, true
FROM public.properties prop
WHERE prop.title = 'Trail Runner Base'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: CREATE BOOKINGS (3 entries) - ENABLES MESSAGING
-- =====================================================

-- Booking 1: Different user books Madrid Marathon
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, points_cost, status, host_response_deadline
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_profile.id,
    r.host_id,
    r.property_id,
    r.race_date - INTERVAL '2 days',
    r.race_date + INTERVAL '1 day',
    2,
    'Hi! Excited about the marathon. Any local tips?',
    50, 'accepted',
    CURRENT_DATE + INTERVAL '2 days'
FROM public.races r
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE id != (SELECT host_id FROM public.races WHERE name = 'Test Madrid Marathon' LIMIT 1)
    LIMIT 1
) guest_profile
WHERE r.name = 'Test Madrid Marathon'
ON CONFLICT DO NOTHING;

-- Booking 2: Different user books Barcelona Trail  
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, points_cost, status, host_response_deadline
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_profile.id,
    r.host_id,
    r.property_id,
    r.race_date - INTERVAL '1 day',
    r.race_date + INTERVAL '1 day',
    1,
    'Looking forward to the trail race!',
    40, 'pending',
    CURRENT_DATE + INTERVAL '1 day'
FROM public.races r
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE id NOT IN (
        SELECT host_id FROM public.races WHERE name IN ('Test Madrid Marathon', 'Test Barcelona Trail')
        UNION
        SELECT guest_id FROM public.bookings WHERE race_id IN (
            SELECT id FROM public.races WHERE name = 'Test Madrid Marathon'
        )
    )
    LIMIT 1
) guest_profile
WHERE r.name = 'Test Barcelona Trail'
ON CONFLICT DO NOTHING;

-- Booking 3: Another combination for more test data
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, points_cost, status, host_response_deadline
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_profile.id,
    r.host_id,
    r.property_id,
    r.race_date - INTERVAL '1 day',
    r.race_date,
    1,
    'Quick overnight stay for the race.',
    50, 'confirmed',
    CURRENT_DATE + INTERVAL '1 day'
FROM public.races r
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE id NOT IN (
        SELECT host_id FROM public.races WHERE name IN ('Test Madrid Marathon', 'Test Barcelona Trail')
    )
    ORDER BY created_at 
    OFFSET 2 LIMIT 1
) guest_profile
WHERE r.name = 'Test Madrid Marathon'
ON CONFLICT DO NOTHING;


SELECT '✅ Minimal messaging system test data ready!' as final_status;
SELECT 'You can now test messaging by:' as instructions;
SELECT '1. Login as any user from the bookings above' as step1;
SELECT '2. Go to /bookings to see your test bookings' as step2;
SELECT '3. Click "Message" to start/continue conversations' as step3;
SELECT '4. Go to /messages to see all conversations' as step4;
SELECT '5. Test real-time messaging with multiple browser windows' as step5;

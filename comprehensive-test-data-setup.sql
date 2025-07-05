-- =====================================================
-- COMPREHENSIVE MESSAGING SYSTEM TEST DATA SETUP
-- =====================================================
-- This creates realistic test data for the messaging system
-- Run this AFTER applying the messaging migration

BEGIN;

-- =====================================================
-- STEP 1: CLEAN UP EXISTING TEST DATA (Optional)
-- =====================================================
-- Uncomment these lines if you want to start fresh
/*
DELETE FROM public.booking_messages WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE 
  race_id IN (SELECT id FROM public.races WHERE name LIKE 'Test%')
);
DELETE FROM public.conversations WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE 
  race_id IN (SELECT id FROM public.races WHERE name LIKE 'Test%')
);
DELETE FROM public.bookings WHERE race_id IN (
  SELECT id FROM public.races WHERE name LIKE 'Test%'
);
DELETE FROM public.races WHERE name LIKE 'Test%';
DELETE FROM public.properties WHERE title LIKE 'Test%';
DELETE FROM public.profiles WHERE first_name LIKE 'Test%';
*/

-- =====================================================
-- STEP 2: CREATE TEST PROFILES FOR EXISTING AUTH USERS
-- =====================================================

-- Check current users and create profiles
SELECT 'Creating test profiles for existing auth users...' as step;

-- Create or update profiles for existing auth users
-- You may need to adjust these based on your actual auth.users

-- Method 1: If you have existing auth users, update their profiles
DO $$
DECLARE
    user_record RECORD;
    host_count INTEGER := 0;
    guest_count INTEGER := 0;
BEGIN
    -- Loop through existing auth users and create/update profiles
    FOR user_record IN 
        SELECT id, email FROM auth.users ORDER BY created_at LIMIT 10
    LOOP
        -- Alternate between creating hosts and guests
        IF host_count < 3 THEN
            INSERT INTO public.profiles (
                id, email, first_name, last_name, 
                is_host, is_guest, verification_status,
                running_experience, preferred_distances, 
                average_rating, points_balance
            ) VALUES (
                user_record.id, 
                user_record.email,
                'Test Host ' || (host_count + 1),
                'User',
                true, false, 'approved',
                'intermediate',
                ARRAY['10k', 'half_marathon', 'marathon'],
                4.5, 100
            ) ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                is_host = true,
                is_guest = false,
                verification_status = 'approved',
                average_rating = EXCLUDED.average_rating,
                points_balance = EXCLUDED.points_balance;
            
            host_count := host_count + 1;
        ELSE
            INSERT INTO public.profiles (
                id, email, first_name, last_name, 
                is_host, is_guest, verification_status,
                running_experience, preferred_distances,
                average_rating, points_balance
            ) VALUES (
                user_record.id, 
                user_record.email,
                'Test Runner ' || (guest_count + 1),
                'Guest',
                false, true, 'approved',
                'beginner',
                ARRAY['5k', '10k'],
                4.2, 150
            ) ON CONFLICT (id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                is_host = false,
                is_guest = true,
                verification_status = 'approved',
                average_rating = EXCLUDED.average_rating,
                points_balance = EXCLUDED.points_balance;
            
            guest_count := guest_count + 1;
        END IF;
        
        -- Stop after creating enough test users
        EXIT WHEN host_count >= 3 AND guest_count >= 3;
    END LOOP;
    
    RAISE NOTICE 'Created % host profiles and % guest profiles', host_count, guest_count;
END $$;

-- =====================================================
-- STEP 3: CREATE TEST PROPERTIES
-- =====================================================

SELECT 'Creating test properties...' as step;

-- Property 1: Madrid Marathon Location
INSERT INTO public.properties (
    id, owner_id, title, description, provinces, locality, full_address,
    latitude, longitude, bedrooms, beds, bathrooms, max_guests,
    amenities, house_rules, check_in_instructions, runner_instructions,
    cancellation_policy, is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Test Property - Madrid Marathon Base',
    'Perfect location for Madrid Marathon runners. Close to the start line with all amenities needed for race preparation and recovery.',
    ARRAY['Madrid'],
    'Madrid Centro',
    'Calle Gran Vía 123, Madrid, España',
    40.4168, -3.7038,
    2, 3, 2, 4,
    ARRAY['wifi', 'kitchen', 'washing_machine', 'parking', 'air_conditioning'],
    'No smoking. Quiet hours after 22:00. Perfect for runners!',
    'Check-in after 15:00. Keys in lockbox - code will be sent 24h before arrival.',
    'Great running routes nearby! Metro stop 2 minutes walk. Pasta restaurants recommended nearby.',
    'flexible',
    true, 4.8
FROM public.profiles p
WHERE p.is_host = true AND p.first_name LIKE 'Test Host%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Property 2: Barcelona Trail Running Haven
INSERT INTO public.properties (
    id, owner_id, title, description, provinces, locality, full_address,
    latitude, longitude, bedrooms, beds, bathrooms, max_guests,
    amenities, house_rules, check_in_instructions, runner_instructions,
    cancellation_policy, is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Test Property - Barcelona Trail Paradise',
    'Mountain view apartment perfect for trail runners. Direct access to Collserola trails.',
    ARRAY['Barcelona'],
    'Sarrià-Sant Gervasi',
    'Carrer de Balmes 456, Barcelona, España',
    41.4036, 2.1744,
    1, 2, 1, 2,
    ARRAY['wifi', 'kitchen', 'mountain_view', 'trail_access'],
    'Trail runners welcome! Muddy shoes OK in entrance.',
    'Self check-in available. Trail maps provided.',
    'Amazing trail network starts right from the building! Water fountains marked on provided map.',
    'moderate',
    true, 4.9
FROM public.profiles p
WHERE p.is_host = true AND p.first_name LIKE 'Test Host%'
ORDER BY p.created_at
OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

-- Property 3: Valencia Coastal Running Base
INSERT INTO public.properties (
    id, owner_id, title, description, provinces, locality, full_address,
    latitude, longitude, bedrooms, beds, bathrooms, max_guests,
    amenities, house_rules, check_in_instructions, runner_instructions,
    cancellation_policy, is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Test Property - Valencia Beach Runner Loft',
    'Beachfront loft perfect for coastal runs and recovery. Valencia Marathon headquarters nearby.',
    ARRAY['Valencia'],
    'Ciutat Vella',
    'Carrer de la Paz 789, Valencia, España',
    39.4699, -0.3763,
    1, 1, 1, 2,
    ARRAY['wifi', 'beach_access', 'kitchen', 'bike_storage'],
    'Beach runners paradise! Sandy feet welcome.',
    'Key pickup at reception. Beach running route map included.',
    'Perfect 10k beach route marked. Bike available for recovery rides.',
    'strict',
    true, 4.7
FROM public.profiles p
WHERE p.is_host = true AND p.first_name LIKE 'Test Host%'
ORDER BY p.created_at
OFFSET 2 LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: CREATE TEST RACES
-- =====================================================

SELECT 'Creating test races...' as step;

-- Race 1: Madrid Marathon
INSERT INTO public.races (
    id, host_id, property_id, name, description, race_date,
    registration_deadline, modalities, terrain_profile, distances,
    has_wave_starts, start_location, distance_from_property,
    official_website, registration_cost, points_cost, max_guests,
    highlights, local_tips, weather_notes, is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    prop.id,
    'Test Race - Madrid Marathon 2024',
    'Join us for the iconic Madrid Marathon! Flat and fast course through the heart of Spain''s capital.',
    CURRENT_DATE + INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '30 days',
    '["road"]'::jsonb,
    '["flat"]'::jsonb,
    '["marathon", "half_marathon"]'::jsonb,
    true,
    'Puerta del Sol, Madrid',
    1.2,
    'https://example.com/madrid-marathon',
    45.00, 75, 4,
    'Historic route through Madrid''s most iconic landmarks. Perfect for PB attempts!',
    'Start early, finish with tapas! Best paella places marked on route.',
    'April weather perfect for running. Pack light layers.',
    true, 4.6
FROM public.profiles p
JOIN public.properties prop ON prop.owner_id = p.id
WHERE p.is_host = true 
  AND prop.title LIKE '%Madrid%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Race 2: Barcelona Trail Challenge
INSERT INTO public.races (
    id, host_id, property_id, name, description, race_date,
    registration_deadline, modalities, terrain_profile, distances,
    has_wave_starts, start_location, distance_from_property,
    points_cost, max_guests, highlights, local_tips, weather_notes,
    is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    prop.id,
    'Test Race - Barcelona Trail Challenge',
    'Technical trail race through Collserola Natural Park with stunning city views.',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '45 days',
    '["trail"]'::jsonb,
    '["hilly"]'::jsonb,
    '["20k", "10k"]'::jsonb,
    false,
    'Collserola Park Entrance',
    0.5,
    50, 2,
    'Technical single track with 800m elevation gain. Views of Barcelona and Mediterranean!',
    'Bring trail shoes! Water stations every 5k. Recovery beer at finish line.',
    'Mountain weather can change quickly. Check forecast.',
    true, 4.8
FROM public.profiles p
JOIN public.properties prop ON prop.owner_id = p.id
WHERE p.is_host = true 
  AND prop.title LIKE '%Barcelona%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Race 3: Valencia Beach Run
INSERT INTO public.races (
    id, host_id, property_id, name, description, race_date,
    registration_deadline, modalities, terrain_profile, distances,
    has_wave_starts, start_location, distance_from_property,
    points_cost, max_guests, highlights, local_tips, weather_notes,
    is_active, average_rating
)
SELECT 
    gen_random_uuid(),
    p.id,
    prop.id,
    'Test Race - Valencia Sunrise Beach Run',
    'Early morning beach run along Valencia''s beautiful coastline. Flat and scenic.',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '20 days',
    '["road"]'::jsonb,
    '["flat"]'::jsonb,
    '["15k", "10k", "5k"]'::jsonb,
    true,
    'Playa de la Malvarrosa',
    0.3,
    40, 2,
    'Sunrise start at 7 AM. Flat beachfront course with Mediterranean views.',
    'Bring sunglasses! Post-race breakfast on the beach. Parking available.',
    'Early morning can be cool. Light jacket recommended for warm-up.',
    true, 4.5
FROM public.profiles p
JOIN public.properties prop ON prop.owner_id = p.id
WHERE p.is_host = true 
  AND prop.title LIKE '%Valencia%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 5: CREATE TEST BOOKINGS (This enables messaging!)
-- =====================================================

SELECT 'Creating test bookings to enable messaging...' as step;

-- Booking 1: Guest 1 books Madrid Marathon
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, special_requests, guest_phone,
    estimated_arrival_time, points_cost, status,
    host_response_deadline, created_at
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_p.id,
    host_p.id,
    r.property_id,
    r.race_date - INTERVAL '2 days',
    r.race_date + INTERVAL '1 day',
    2,
    'Hi! Very excited about the Madrid Marathon. This will be my first marathon and your property looks perfect for our stay. We''re planning to arrive Friday evening to pick up race packets on Saturday. Any recommendations for pre-race dinner?',
    'We''re vegetarian and would love restaurant recommendations. Also need early breakfast before 6 AM race start.',
    '+34 600 123 456',
    '18:00',
    75, 'accepted',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '5 days'
FROM public.races r
JOIN public.profiles host_p ON r.host_id = host_p.id
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE is_guest = true AND first_name LIKE 'Test Runner%' 
    LIMIT 1
) guest_p
WHERE r.name LIKE '%Madrid Marathon%'
ON CONFLICT DO NOTHING;

-- Booking 2: Guest 2 books Barcelona Trail
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, guest_phone, points_cost, status,
    host_response_deadline, created_at
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_p.id,
    host_p.id,
    r.property_id,
    r.race_date - INTERVAL '1 day',
    r.race_date + INTERVAL '1 day',
    1,
    'Hello! I''m coming from the UK for the Barcelona Trail Challenge. This is my first time in Barcelona and I''m really excited about the technical trails. Could you share some tips about the course?',
    '+44 7700 900 123',
    50, 'pending',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '2 days'
FROM public.races r
JOIN public.profiles host_p ON r.host_id = host_p.id
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE is_guest = true AND first_name LIKE 'Test Runner%' 
    ORDER BY created_at OFFSET 1 LIMIT 1
) guest_p
WHERE r.name LIKE '%Barcelona Trail%'
ON CONFLICT DO NOTHING;

-- Booking 3: Guest 3 books Valencia Beach Run
INSERT INTO public.bookings (
    id, race_id, guest_id, host_id, property_id,
    check_in_date, check_out_date, guests_count,
    request_message, guest_phone, points_cost, status,
    host_response_deadline, created_at, accepted_at
)
SELECT 
    gen_random_uuid(),
    r.id,
    guest_p.id,
    host_p.id,
    r.property_id,
    r.race_date - INTERVAL '1 day',
    r.race_date,
    1,
    'Hi there! Coming for the sunrise beach run - so excited! I''ve heard Valencia has the best running weather in Spain. Just one night stay as I''m continuing to Madrid after the race.',
    '+33 6 12 34 56 78',
    40, 'confirmed',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '2 days'
FROM public.races r
JOIN public.profiles host_p ON r.host_id = host_p.id
CROSS JOIN (
    SELECT id FROM public.profiles 
    WHERE is_guest = true AND first_name LIKE 'Test Runner%' 
    ORDER BY created_at OFFSET 2 LIMIT 1
) guest_p
WHERE r.name LIKE '%Valencia%'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 6: CREATE INITIAL TEST MESSAGES
-- =====================================================

SELECT 'Creating initial test messages to populate conversations...' as step;

-- Message 1: Host response to Madrid Marathon booking
INSERT INTO public.booking_messages (
    id, booking_id, sender_id, message, message_type, created_at
)
SELECT 
    gen_random_uuid(),
    b.id,
    b.host_id,
    'Welcome to Madrid! So excited to host you for your first marathon. For vegetarian restaurants, I highly recommend "La Biotika" just 2 blocks away - they have amazing pre-race pasta options. I can prepare a simple breakfast for you at 5:30 AM if you''d like. The race packet pickup is at IFEMA, about 15 minutes by metro. Let me know if you need anything else!',
    'text',
    CURRENT_DATE - INTERVAL '4 days'
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE '%Madrid Marathon%'
  AND b.status = 'accepted'
LIMIT 1;

-- Message 2: Guest reply to host
INSERT INTO public.booking_messages (
    id, booking_id, sender_id, message, message_type, created_at
)
SELECT 
    gen_random_uuid(),
    b.id,
    b.guest_id,
    'Thank you so much! La Biotika sounds perfect - we''ll definitely check it out. And yes please to the early breakfast, that would be amazing! Just something light like toast and coffee would be perfect. Really appreciate all your help - this is going to make our marathon experience so much better! 🏃‍♀️',
    'text',
    CURRENT_DATE - INTERVAL '3 days'
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE '%Madrid Marathon%'
  AND b.status = 'accepted'
LIMIT 1;

-- Message 3: Host for Barcelona Trail (pending booking)
INSERT INTO public.booking_messages (
    id, booking_id, sender_id, message, message_type, created_at
)
SELECT 
    gen_random_uuid(),
    b.id,
    b.host_id,
    'Hi! Welcome to Barcelona! I''d love to accept your booking. The Barcelona Trail Challenge is fantastic - very technical but the views are incredible. The course has some steep sections around km 8-12, so make sure you''re comfortable with technical descents. I have detailed trail maps and can mark the tricky sections. Water stations are at km 5, 10, and 15. What''s your trail running experience like?',
    'text',
    CURRENT_DATE - INTERVAL '2 days'
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE '%Barcelona Trail%'
  AND b.status = 'pending'
LIMIT 1;

-- Message 4: Valencia confirmed booking conversation
INSERT INTO public.booking_messages (
    id, booking_id, sender_id, message, message_type, created_at
)
SELECT 
    gen_random_uuid(),
    b.id,
    b.host_id,
    'Hola! Perfect timing for the sunrise run - you''ll love it! The weather forecast looks great. Check-in is anytime after 14:00. I''ll leave you a welcome pack with local running routes and some energy bars. The beach route is absolutely beautiful at sunrise. Have a safe trip!',
    'text',
    CURRENT_DATE - INTERVAL '1 day'
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE '%Valencia%'
  AND b.status = 'confirmed'
LIMIT 1;

-- =====================================================
-- STEP 7: VERIFICATION AND SUMMARY
-- =====================================================

SELECT 'Test data creation complete! Here''s your summary:' as result;

-- Summary of created data
SELECT 
    'Profiles created' as item,
    COUNT(*) as count
FROM public.profiles 
WHERE first_name LIKE 'Test%'
UNION ALL
SELECT 
    'Properties created' as item,
    COUNT(*) as count
FROM public.properties 
WHERE title LIKE 'Test%'
UNION ALL
SELECT 
    'Races created' as item,
    COUNT(*) as count
FROM public.races 
WHERE name LIKE 'Test%'
UNION ALL
SELECT 
    'Bookings created' as item,
    COUNT(*) as count
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE 'Test%'
UNION ALL
SELECT 
    'Messages created' as item,
    COUNT(*) as count
FROM public.booking_messages bm
JOIN public.bookings b ON bm.booking_id = b.id
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE 'Test%'
UNION ALL
SELECT 
    'Conversations auto-created' as item,
    COUNT(*) as count
FROM public.conversations c
JOIN public.bookings b ON c.booking_id = b.id
JOIN public.races r ON b.race_id = r.id
WHERE r.name LIKE 'Test%';

-- Show the test bookings with messaging enabled
SELECT 
    'Test bookings ready for messaging:' as info,
    b.id as booking_id,
    hp.first_name || ' ' || hp.last_name as host,
    gp.first_name || ' ' || gp.last_name as guest,
    r.name as race,
    b.status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.booking_messages WHERE booking_id = b.id) 
        THEN 'Has messages ✅' 
        ELSE 'No messages yet' 
    END as message_status
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
JOIN public.profiles hp ON b.host_id = hp.id
JOIN public.profiles gp ON b.guest_id = gp.id
WHERE r.name LIKE 'Test%'
ORDER BY b.created_at;

-- Show which users you can test with
SELECT 
    'Test users for messaging:' as info,
    p.id as user_id,
    p.email,
    p.first_name || ' ' || p.last_name as name,
    CASE WHEN p.is_host THEN 'Host' WHEN p.is_guest THEN 'Guest' ELSE 'Unknown' END as role
FROM public.profiles p
WHERE p.first_name LIKE 'Test%'
ORDER BY p.is_host DESC, p.created_at;

COMMIT;

SELECT '🎉 Messaging system test data setup complete!' as final_status;
SELECT 'You can now:' as instructions;
SELECT '1. Login as any test user (check auth.users table for emails)' as step1;
SELECT '2. Go to /bookings to see test bookings' as step2;
SELECT '3. Click "Message" button to start chatting' as step3;
SELECT '4. Go to /messages to see all conversations' as step4;
SELECT '5. Test real-time messaging by opening multiple browser windows' as step5;

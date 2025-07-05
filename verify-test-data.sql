-- =====================================================
-- QUICK TEST DATA VERIFICATION SCRIPT
-- =====================================================
-- Run this after the test data setup to verify everything worked

-- Step 1: Check auth users and their profiles
SELECT 'Current auth users and their profiles:' as info;
SELECT 
    au.id,
    au.email,
    p.first_name,
    p.last_name,
    CASE WHEN p.is_host THEN 'Host' WHEN p.is_guest THEN 'Guest' ELSE 'None' END as role,
    p.verification_status,
    p.points_balance
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at;

-- Step 2: Check test properties
SELECT 'Test properties created:' as info;
SELECT 
    p.id,
    p.title,
    p.locality,
    p.max_guests,
    owner.first_name || ' ' || owner.last_name as owner_name,
    p.is_active
FROM public.properties p
JOIN public.profiles owner ON p.owner_id = owner.id
WHERE p.title LIKE 'Test%'
ORDER BY p.created_at;

-- Step 3: Check test races
SELECT 'Test races created:' as info;
SELECT 
    r.id,
    r.name,
    r.race_date,
    host.first_name || ' ' || host.last_name as host_name,
    prop.title as property_title,
    r.points_cost,
    r.is_active
FROM public.races r
JOIN public.profiles host ON r.host_id = host.id
JOIN public.properties prop ON r.property_id = prop.id
WHERE r.name LIKE 'Test%'
ORDER BY r.race_date;

-- Step 4: Check test bookings (these enable messaging)
SELECT 'Test bookings created (messaging enabled):' as info;
SELECT 
    b.id,
    r.name as race_name,
    host.first_name || ' ' || host.last_name as host_name,
    guest.first_name || ' ' || guest.last_name as guest_name,
    b.status,
    b.check_in_date,
    b.points_cost,
    LENGTH(b.request_message) as message_length
FROM public.bookings b
JOIN public.races r ON b.race_id = r.id
JOIN public.profiles host ON b.host_id = host.id
JOIN public.profiles guest ON b.guest_id = guest.id
WHERE r.name LIKE 'Test%'
ORDER BY b.created_at;

-- Step 5: Check auto-created conversations
SELECT 'Auto-created conversations:' as info;
SELECT 
    c.id as conversation_id,
    b.id as booking_id,
    r.name as race_name,
    p1.first_name || ' ' || p1.last_name as participant_1,
    p2.first_name || ' ' || p2.last_name as participant_2,
    c.unread_count_p1,
    c.unread_count_p2,
    c.last_message_at
FROM public.conversations c
JOIN public.bookings b ON c.booking_id = b.id
JOIN public.races r ON b.race_id = r.id
JOIN public.profiles p1 ON c.participant_1_id = p1.id
JOIN public.profiles p2 ON c.participant_2_id = p2.id
WHERE r.name LIKE 'Test%'
ORDER BY c.last_message_at DESC;

-- Step 6: Check test messages
SELECT 'Test messages created:' as info;
SELECT 
    m.id,
    r.name as race_name,
    sender.first_name || ' ' || sender.last_name as sender_name,
    LEFT(m.message, 50) || '...' as message_preview,
    m.message_type,
    m.created_at,
    CASE WHEN m.read_at IS NOT NULL THEN 'Read' ELSE 'Unread' END as read_status
FROM public.booking_messages m
JOIN public.bookings b ON m.booking_id = b.id
JOIN public.races r ON b.race_id = r.id
JOIN public.profiles sender ON m.sender_id = sender.id
WHERE r.name LIKE 'Test%'
ORDER BY m.created_at;

-- Step 7: Test the frontend query that was failing
SELECT 'Testing frontend conversations query:' as test_info;
SELECT 
    c.id,
    c.booking_id,
    c.last_message,
    c.unread_count_p1,
    c.unread_count_p2,
    p1.first_name as participant_1_name,
    p2.first_name as participant_2_name
FROM public.conversations c
LEFT JOIN public.profiles p1 ON c.participant_1_id = p1.id
LEFT JOIN public.profiles p2 ON c.participant_2_id = p2.id
ORDER BY c.last_message_at DESC
LIMIT 5;

-- Step 8: Show how to test login
SELECT 'To test the messaging system:' as instructions;
SELECT '1. Check auth.users table for user emails/credentials' as step1;
SELECT '2. Login as any test user in the app' as step2;
SELECT '3. Navigate to /bookings to see your test bookings' as step3;
SELECT '4. Click "Message" button to open chat' as step4;
SELECT '5. Send messages and test real-time functionality' as step5;
SELECT '6. Open another browser/incognito window and login as different user' as step6;
SELECT '7. Test real-time messaging between the two users' as step7;

-- Step 9: Quick user credentials (if you need to create actual login credentials)
SELECT 'Available test users for login:' as login_info;
SELECT 
    au.email,
    p.first_name || ' ' || p.last_name as name,
    CASE WHEN p.is_host THEN 'Host (can receive messages)' 
         WHEN p.is_guest THEN 'Guest (can send messages)' 
         ELSE 'Unknown role' END as role_description
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE p.first_name LIKE 'Test%'
ORDER BY p.is_host DESC;

SELECT '✅ Verification complete! Your messaging system test data is ready.' as final_result;

-- =====================================================
-- CLEANUP TEST DATA SCRIPT (OPTIONAL)
-- =====================================================
-- Run this if you want to remove all test data

BEGIN;

SELECT 'Cleaning up test messaging data...' as info;

-- Step 1: Remove test messages
DELETE FROM public.booking_messages 
WHERE booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.races r ON b.race_id = r.id
    WHERE r.name LIKE 'Test%'
);

-- Step 2: Remove test conversations (will be auto-removed by CASCADE)
DELETE FROM public.conversations 
WHERE booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.races r ON b.race_id = r.id
    WHERE r.name LIKE 'Test%'
);

-- Step 3: Remove test bookings
DELETE FROM public.bookings 
WHERE race_id IN (
    SELECT id FROM public.races WHERE name LIKE 'Test%'
);

-- Step 4: Remove test races
DELETE FROM public.races WHERE name LIKE 'Test%';

-- Step 5: Remove test properties
DELETE FROM public.properties WHERE title LIKE 'Test%';

-- Step 6: Remove test profiles (optional - comment out if you want to keep them)
-- DELETE FROM public.profiles WHERE first_name LIKE 'Test%';

-- Step 7: Remove test notifications (if any were created)
DELETE FROM public.user_notifications 
WHERE title LIKE '%Messaging System%' OR message LIKE '%messaging%';

COMMIT;

SELECT 'Test data cleanup complete!' as result;
SELECT 'Note: Test user profiles were preserved. Delete manually if needed.' as note;

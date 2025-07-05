-- =====================================================
-- APPLY BOOKINGS FOREIGN KEY FIX
-- =====================================================
-- This applies the fix for bookings foreign key relationships to profiles

-- Check current foreign keys
SELECT 'Current bookings foreign keys before fix:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bookings' AND tc.constraint_type = 'FOREIGN KEY';

-- Apply the fix: Add foreign key constraints between bookings and profiles
-- Since profiles.id = auth.users.id, we can create these relationships

DO $$
BEGIN
    -- Check if the foreign key from bookings to profiles already exists for guest_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'bookings_guest_id_profiles_fkey'
    ) THEN
        -- Add foreign key for guest_id -> profiles.id
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_guest_id_profiles_fkey 
        FOREIGN KEY (guest_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added bookings_guest_id_profiles_fkey constraint';
    ELSE
        RAISE NOTICE 'bookings_guest_id_profiles_fkey constraint already exists';
    END IF;

    -- Check if the foreign key from bookings to profiles already exists for host_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'bookings_host_id_profiles_fkey'
    ) THEN
        -- Add foreign key for host_id -> profiles.id  
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_host_id_profiles_fkey 
        FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added bookings_host_id_profiles_fkey constraint';
    ELSE
        RAISE NOTICE 'bookings_host_id_profiles_fkey constraint already exists';
    END IF;
END $$;

-- Verify the new foreign keys were created
SELECT 'Updated bookings foreign keys after fix:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bookings' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND (tc.constraint_name LIKE '%profiles_fkey' OR tc.constraint_name LIKE '%auth_users%');

-- Test the relationship that the frontend expects
SELECT 'Testing frontend relationship query:' as test;
SELECT 
    b.id,
    b.status,
    host_p.first_name as host_name,
    guest_p.first_name as guest_name
FROM public.bookings b
LEFT JOIN public.profiles host_p ON b.host_id = host_p.id
LEFT JOIN public.profiles guest_p ON b.guest_id = guest_p.id
LIMIT 3;

SELECT '✅ Bookings foreign key relationships fixed!' as result;
SELECT 'The frontend should now be able to query bookings with profiles properly.' as note;

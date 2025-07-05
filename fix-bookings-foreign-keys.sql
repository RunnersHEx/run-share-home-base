-- =====================================================
-- FIX BOOKINGS FOREIGN KEY RELATIONSHIPS
-- =====================================================
-- This fixes the foreign key issue between bookings and profiles
-- The bookings table currently references auth.users but frontend expects profiles

-- Check current foreign keys
SELECT 'Current bookings foreign keys:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bookings' AND tc.constraint_type = 'FOREIGN KEY';

-- Solution: Add foreign key constraints between bookings and profiles
-- Since profiles.id = auth.users.id, we can create these relationships

-- First, let's make sure profiles.id matches auth.users.id constraint
DO $$
BEGIN
    -- Check if the foreign key from bookings to profiles already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name LIKE '%guest_id_profiles_fkey'
    ) THEN
        -- Add foreign key for guest_id -> profiles.id
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_guest_id_profiles_fkey 
        FOREIGN KEY (guest_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added bookings_guest_id_profiles_fkey constraint';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name LIKE '%host_id_profiles_fkey'
    ) THEN
        -- Add foreign key for host_id -> profiles.id  
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_host_id_profiles_fkey 
        FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added bookings_host_id_profiles_fkey constraint';
    END IF;
END $$;

-- Verify the new foreign keys were created
SELECT 'Updated bookings foreign keys:' as info;
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
  AND tc.constraint_name LIKE '%profiles_fkey';

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

-- =====================================================
-- MIGRATE ALL FOREIGN KEYS FROM auth.users TO profiles
-- =====================================================
-- This ensures all business logic is handled through profiles table
-- Run this in Supabase SQL Editor after applying the foreign key fixes

-- Step 1: Show current state
SELECT 'BEFORE MIGRATION - Current foreign keys to auth.users:' as info;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Step 2: BOOKINGS TABLE - Migrate to profiles
SELECT 'STEP 2: Updating bookings table foreign keys...' as step;

-- Drop existing foreign keys to auth.users
DO $$
BEGIN
    -- Drop guest_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'bookings_guest_id_fkey'
    ) THEN
        ALTER TABLE public.bookings DROP CONSTRAINT bookings_guest_id_fkey;
        RAISE NOTICE 'Dropped bookings_guest_id_fkey constraint';
    END IF;
    
    -- Drop host_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'bookings_host_id_fkey'
    ) THEN
        ALTER TABLE public.bookings DROP CONSTRAINT bookings_host_id_fkey;
        RAISE NOTICE 'Dropped bookings_host_id_fkey constraint';
    END IF;
END $$;

-- Add foreign keys to profiles instead
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_guest_id_profiles_fkey 
FOREIGN KEY (guest_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_host_id_profiles_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'Bookings table updated successfully' as result;

-- Step 3: PROPERTIES TABLE - Migrate to profiles
SELECT 'STEP 3: Updating properties table foreign keys...' as step;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'properties' 
        AND constraint_name = 'properties_owner_id_fkey'
    ) THEN
        ALTER TABLE public.properties DROP CONSTRAINT properties_owner_id_fkey;
        RAISE NOTICE 'Dropped properties_owner_id_fkey constraint';
    END IF;
END $$;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_profiles_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'Properties table updated successfully' as result;

-- Step 4: RACES TABLE - Migrate to profiles
SELECT 'STEP 4: Updating races table foreign keys...' as step;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'races' 
        AND constraint_name = 'races_host_id_fkey'
    ) THEN
        ALTER TABLE public.races DROP CONSTRAINT races_host_id_fkey;
        RAISE NOTICE 'Dropped races_host_id_fkey constraint';
    END IF;
END $$;

ALTER TABLE public.races 
ADD CONSTRAINT races_host_id_profiles_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'Races table updated successfully' as result;

-- Step 5: BOOKING_MESSAGES TABLE - Migrate to profiles
SELECT 'STEP 5: Updating booking_messages table foreign keys...' as step;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'booking_messages' 
        AND constraint_name = 'booking_messages_sender_id_fkey'
    ) THEN
        ALTER TABLE public.booking_messages DROP CONSTRAINT booking_messages_sender_id_fkey;
        RAISE NOTICE 'Dropped booking_messages_sender_id_fkey constraint';
    END IF;
END $$;

ALTER TABLE public.booking_messages 
ADD CONSTRAINT booking_messages_sender_id_profiles_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'Booking messages table updated successfully' as result;

-- Step 6: POINTS_TRANSACTIONS TABLE - Migrate to profiles
SELECT 'STEP 6: Updating points_transactions table foreign keys...' as step;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'points_transactions' 
        AND constraint_name = 'points_transactions_user_id_fkey'
    ) THEN
        ALTER TABLE public.points_transactions DROP CONSTRAINT points_transactions_user_id_fkey;
        RAISE NOTICE 'Dropped points_transactions_user_id_fkey constraint';
    END IF;
END $$;

ALTER TABLE public.points_transactions 
ADD CONSTRAINT points_transactions_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

SELECT 'Points transactions table updated successfully' as result;

-- Step 7: OTHER TABLES - Check and update if they exist
SELECT 'STEP 7: Updating other tables...' as step;

-- Verification requests
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'verification_requests'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'verification_requests' 
            AND constraint_name = 'verification_requests_user_id_fkey'
        ) THEN
            ALTER TABLE public.verification_requests DROP CONSTRAINT verification_requests_user_id_fkey;
            RAISE NOTICE 'Dropped verification_requests_user_id_fkey constraint';
        END IF;
        
        ALTER TABLE public.verification_requests 
        ADD CONSTRAINT verification_requests_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated verification_requests table';
    END IF;
END $$;

-- Reviews table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews'
    ) THEN
        -- Update reviewer_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'reviews' 
            AND constraint_name = 'reviews_reviewer_id_fkey'
        ) THEN
            ALTER TABLE public.reviews DROP CONSTRAINT reviews_reviewer_id_fkey;
            RAISE NOTICE 'Dropped reviews_reviewer_id_fkey constraint';
        END IF;
        
        -- Check if column exists before adding constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'reviewer_id'
        ) THEN
            ALTER TABLE public.reviews 
            ADD CONSTRAINT reviews_reviewer_id_profiles_fkey 
            FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated reviews.reviewer_id constraint';
        END IF;
        
        -- Same for reviewee_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'reviews' 
            AND constraint_name = 'reviews_reviewee_id_fkey'
        ) THEN
            ALTER TABLE public.reviews DROP CONSTRAINT reviews_reviewee_id_fkey;
            RAISE NOTICE 'Dropped reviews_reviewee_id_fkey constraint';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'reviewee_id'
        ) THEN
            ALTER TABLE public.reviews 
            ADD CONSTRAINT reviews_reviewee_id_profiles_fkey 
            FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Updated reviews.reviewee_id constraint';
        END IF;
    END IF;
END $$;

-- Admin users table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'admin_users'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'admin_users' 
            AND constraint_name = 'admin_users_user_id_fkey'
        ) THEN
            ALTER TABLE public.admin_users DROP CONSTRAINT admin_users_user_id_fkey;
            RAISE NOTICE 'Dropped admin_users_user_id_fkey constraint';
        END IF;
        
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT admin_users_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated admin_users table';
    END IF;
END $$;

-- Step 8: Refresh PostgREST schema cache
SELECT 'STEP 8: Refreshing schema cache...' as step;
NOTIFY pgrst, 'reload schema';

-- Step 9: VERIFICATION - Check all foreign keys now point to profiles
SELECT 'STEP 9: VERIFICATION - All foreign keys now pointing to profiles:' as info;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'profiles'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Show any remaining foreign keys to auth.users (should be minimal for system tables only)
SELECT 'Remaining foreign keys to auth.users (system tables only):' as warning;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Step 10: Test the foreign key relationships that the frontend expects
SELECT 'STEP 10: Testing frontend relationship queries...' as test;

-- Test bookings with profiles
SELECT 'Testing bookings with profiles:' as subtest;
SELECT 
    b.id,
    b.status,
    guest_p.first_name as guest_name,
    host_p.first_name as host_name
FROM public.bookings b
LEFT JOIN public.profiles guest_p ON b.guest_id = guest_p.id
LEFT JOIN public.profiles host_p ON b.host_id = host_p.id
LIMIT 3;

-- Test messages with profiles
SELECT 'Testing messages with profiles:' as subtest;
SELECT 
    m.id,
    m.message,
    sender_p.first_name as sender_name
FROM public.booking_messages m
LEFT JOIN public.profiles sender_p ON m.sender_id = sender_p.id
LIMIT 3;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
SELECT '🎉 MIGRATION COMPLETED SUCCESSFULLY!' as result;
SELECT 'All business tables now reference profiles instead of auth.users!' as benefit;
SELECT 'Foreign key hints in your frontend code should now work properly.' as frontend_impact;
SELECT 'Your messaging system should work without foreign key errors.' as messaging_impact;
SELECT 'All user operations can now be done through profiles table where is_host/is_guest logic lives.' as business_logic;

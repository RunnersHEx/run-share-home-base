-- =====================================================
-- FOREIGN KEY VERIFICATION SCRIPT
-- =====================================================
-- Run this after applying the fixed migration to verify relationships

-- Step 1: Check if conversations table exists with correct structure
SELECT 'Checking conversations table structure...' as step;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Step 2: Verify foreign key relationships
SELECT 'Checking foreign key relationships...' as step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'conversations' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 3: Test the specific foreign key hints that the frontend uses
SELECT 'Testing frontend foreign key hints...' as step;

-- This should work without errors if the foreign keys are set up correctly
SELECT 
  c.id,
  c.booking_id,
  p1.first_name as participant_1_name,
  p2.first_name as participant_2_name
FROM public.conversations c
LEFT JOIN public.profiles p1 ON c.participant_1_id = p1.id
LEFT JOIN public.profiles p2 ON c.participant_2_id = p2.id
LIMIT 1;

-- Step 4: Check if the foreign key names match what the frontend expects
SELECT 'Checking foreign key constraint names...' as step;
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'conversations' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%participant%';

-- Step 5: Verify profiles table structure
SELECT 'Checking profiles table for reference...' as step;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('id', 'first_name', 'last_name', 'profile_image_url')
ORDER BY ordinal_position;

SELECT '✅ Foreign key verification complete!' as result;

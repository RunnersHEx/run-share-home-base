-- =====================================================
-- TEST THE SPECIFIC FAILING QUERY
-- =====================================================
-- This tests the exact query that's failing in the frontend

-- Test 1: Simple conversations query (should work after migration)
SELECT 'Testing basic conversations query...' as test;
SELECT 
  id,
  booking_id,
  participant_1_id,
  participant_2_id,
  last_message,
  unread_count_p1,
  unread_count_p2
FROM public.conversations
LIMIT 5;

-- Test 2: Test the exact query from the frontend (simplified)
SELECT 'Testing frontend-style query...' as test;
SELECT 
  c.*,
  p1.first_name as participant_1_name,
  p1.last_name as participant_1_lastname,
  p2.first_name as participant_2_name,
  p2.last_name as participant_2_lastname
FROM public.conversations c
LEFT JOIN public.profiles p1 ON c.participant_1_id = p1.id
LEFT JOIN public.profiles p2 ON c.participant_2_id = p2.id
WHERE c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid()
ORDER BY c.last_message_at DESC
LIMIT 5;

-- Test 3: Check if we have any test data
SELECT 'Checking for test data...' as test;
SELECT 
  'Profiles count:' as metric,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Bookings count:' as metric,
  COUNT(*) as count
FROM public.bookings;

SELECT 
  'Conversations count:' as metric,
  COUNT(*) as count
FROM public.conversations;

-- Test 4: If no conversations exist, this is expected (they're created when messages are sent)
SELECT 'Note: If no conversations exist, that''s normal - they''re created automatically when first message is sent' as info;

-- Test 5: Show current user (for debugging)
SELECT 'Current authenticated user:' as info, auth.uid() as user_id;

-- =====================================================
-- MESSAGING SYSTEM TEST SCRIPT
-- =====================================================
-- Run this after applying the main migration to test functionality

-- Step 1: Verify table structure
SELECT 'Checking conversations table...' as step;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

SELECT 'Checking booking_messages enhancements...' as step;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'booking_messages'
  AND column_name IN ('conversation_id', 'message_type', 'edited_at')
ORDER BY ordinal_position;

-- Step 2: Check RLS status
SELECT 'Checking RLS status...' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('conversations', 'booking_messages');

-- Step 3: Verify policies exist
SELECT 'Checking security policies...' as step;
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('conversations', 'booking_messages')
ORDER BY tablename, policyname;

-- Step 4: Check realtime publication
SELECT 'Checking realtime configuration...' as step;
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('conversations', 'booking_messages');

-- Step 5: Verify functions exist
SELECT 'Checking messaging functions...' as step;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'create_conversation_if_not_exists',
  'update_conversation_on_message', 
  'mark_messages_as_read',
  'get_user_unread_count'
);

-- Step 6: Check triggers
SELECT 'Checking triggers...' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'create_conversation_trigger',
  'update_conversation_trigger',
  'update_conversations_updated_at'
);

-- Step 7: Verify indexes
SELECT 'Checking performance indexes...' as step;
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('conversations', 'booking_messages')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Step 8: Test basic functionality (if you have test data)
SELECT 'Testing with existing data...' as step;

-- Count existing bookings
SELECT 
  'Total bookings:' as metric,
  COUNT(*) as count
FROM public.bookings;

-- Count existing messages  
SELECT 
  'Total messages:' as metric,
  COUNT(*) as count
FROM public.booking_messages;

-- Count new conversations
SELECT 
  'Total conversations:' as metric,
  COUNT(*) as count
FROM public.conversations;

-- Check if conversations were created for existing bookings
SELECT 
  'Bookings with conversations:' as metric,
  COUNT(*) as count
FROM public.bookings b
JOIN public.conversations c ON b.id = c.booking_id;

-- Step 9: Sample conversation data (if any exists)
SELECT 'Sample conversation data...' as step;
SELECT 
  c.id as conversation_id,
  c.booking_id,
  p1.first_name as participant_1,
  p2.first_name as participant_2,
  c.last_message,
  c.unread_count_p1,
  c.unread_count_p2
FROM public.conversations c
LEFT JOIN public.profiles p1 ON c.participant_1_id = p1.id
LEFT JOIN public.profiles p2 ON c.participant_2_id = p2.id
LIMIT 5;

-- Step 10: Test unread count function (if you have users)
SELECT 'Testing unread count function...' as step;
SELECT 
  p.first_name,
  p.last_name,
  public.get_user_unread_count(p.id) as unread_count
FROM public.profiles p
WHERE p.is_host = true OR p.is_guest = true
LIMIT 3;

SELECT '✅ Migration verification complete!' as result;

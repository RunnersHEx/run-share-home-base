-- Fix RLS Policies for Conversations Table
-- This addresses the 406 (Not Acceptable) error when accessing conversations

-- =====================================================
-- 1. ENABLE RLS (if not already enabled)
-- =====================================================

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE RLS POLICIES FOR CONVERSATIONS
-- =====================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations for their bookings" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated users to view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated users to create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow authenticated users to update conversations" ON public.conversations;

-- Policy for viewing conversations - allow users to see conversations they're part of
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Policy for creating conversations - allow users to create conversations for bookings they're part of
CREATE POLICY "Users can create conversations for their bookings" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT guest_id FROM public.bookings WHERE id = booking_id
      UNION
      SELECT host_id FROM public.bookings WHERE id = booking_id
    )
    AND (
      auth.uid() = participant_1_id OR auth.uid() = participant_2_id
    )
  );

-- Policy for updating conversations - allow users to update conversations they're part of
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- =====================================================
-- 3. CREATE RLS POLICIES FOR BOOKING_MESSAGES (if missing)
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.booking_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.booking_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.booking_messages;
DROP POLICY IF EXISTS "Allow users to view booking messages" ON public.booking_messages;
DROP POLICY IF EXISTS "Allow users to send booking messages" ON public.booking_messages;
DROP POLICY IF EXISTS "Allow users to update their own messages" ON public.booking_messages;

-- Policy for viewing messages - allow users to see messages in bookings they're part of
CREATE POLICY "Users can view messages in their conversations" ON public.booking_messages
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- Policy for sending messages - allow users to send messages in bookings they're part of
CREATE POLICY "Users can send messages in their conversations" ON public.booking_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (
      SELECT id FROM public.bookings 
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- Policy for updating own messages - allow users to update their own messages
CREATE POLICY "Users can update their own messages" ON public.booking_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- 4. ENABLE REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add tables to realtime publication if not already added
DO $$ 
BEGIN
  -- Add conversations to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'conversations table already in realtime publication';
  END;

  -- Add booking_messages to realtime  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_messages;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'booking_messages table already in realtime publication';
  END;
END $$;

-- =====================================================
-- 5. GRANT TABLE PERMISSIONS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.booking_messages TO authenticated;

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS (if they don't exist)
-- =====================================================

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_booking_id UUID, p_user_id UUID)
RETURNS void AS $$
DECLARE
  guest_id UUID;
  host_id UUID;
BEGIN
  -- Get booking participants
  SELECT b.guest_id, b.host_id 
  INTO guest_id, host_id
  FROM public.bookings b 
  WHERE b.id = p_booking_id;
  
  -- Verify user is part of this booking
  IF p_user_id != guest_id AND p_user_id != host_id THEN
    RAISE EXCEPTION 'Unauthorized: User is not part of this booking conversation';
  END IF;
  
  -- Mark unread messages as read for this user
  UPDATE public.booking_messages 
  SET read_at = now()
  WHERE booking_id = p_booking_id 
    AND sender_id != p_user_id 
    AND read_at IS NULL;
  
  -- Reset unread count for this user in conversation
  UPDATE public.conversations 
  SET 
    unread_count_p1 = CASE 
      WHEN participant_1_id = p_user_id THEN 0 
      ELSE unread_count_p1 
    END,
    unread_count_p2 = CASE 
      WHEN participant_2_id = p_user_id THEN 0 
      ELSE unread_count_p2 
    END,
    updated_at = now()
  WHERE booking_id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      CASE 
        WHEN participant_1_id = p_user_id THEN unread_count_p1
        WHEN participant_2_id = p_user_id THEN unread_count_p2
        ELSE 0
      END
    ), 0)
    FROM public.conversations 
    WHERE participant_1_id = p_user_id OR participant_2_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions to authenticated users
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unread_count(UUID) TO authenticated;

-- =====================================================
-- 7. ADMIN POLICIES (if admin system exists)
-- =====================================================

-- Allow admins to view all conversations (for moderation)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    -- Admin policies for conversations
    CREATE POLICY "Admins can view all conversations" ON public.conversations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE user_id = auth.uid()
        )
      );
    
    -- Admin policies for messages
    CREATE POLICY "Admins can view all messages" ON public.booking_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Verify that RLS is enabled and policies exist
DO $$
DECLARE
  conversations_rls_enabled BOOLEAN;
  booking_messages_rls_enabled BOOLEAN;
  conversations_policies_count INTEGER;
  booking_messages_policies_count INTEGER;
BEGIN
  -- Check RLS status
  SELECT relrowsecurity INTO conversations_rls_enabled 
  FROM pg_class WHERE relname = 'conversations';
  
  SELECT relrowsecurity INTO booking_messages_rls_enabled 
  FROM pg_class WHERE relname = 'booking_messages';
  
  -- Count policies
  SELECT COUNT(*) INTO conversations_policies_count 
  FROM pg_policies WHERE tablename = 'conversations';
  
  SELECT COUNT(*) INTO booking_messages_policies_count 
  FROM pg_policies WHERE tablename = 'booking_messages';
  
  -- Report status
  IF conversations_rls_enabled THEN
    RAISE NOTICE 'conversations table: RLS enabled ✓ (% policies)', conversations_policies_count;
  ELSE
    RAISE WARNING 'conversations table: RLS not enabled!';
  END IF;
  
  IF booking_messages_rls_enabled THEN
    RAISE NOTICE 'booking_messages table: RLS enabled ✓ (% policies)', booking_messages_policies_count;
  ELSE
    RAISE WARNING 'booking_messages table: RLS not enabled!';
  END IF;
  
  -- Check for minimum required policies
  IF conversations_policies_count < 3 THEN
    RAISE WARNING 'conversations table has insufficient policies (% < 3)', conversations_policies_count;
  END IF;
  
  IF booking_messages_policies_count < 3 THEN
    RAISE WARNING 'booking_messages table has insufficient policies (% < 3)', booking_messages_policies_count;
  END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

COMMENT ON POLICY "Users can view their own conversations" ON public.conversations IS 
'Allows users to view conversations where they are participant_1 or participant_2';

COMMENT ON POLICY "Users can view messages in their conversations" ON public.booking_messages IS 
'Allows users to view messages in bookings where they are guest or host';

-- Final verification and completion message
DO $
BEGIN
  RAISE NOTICE '🎉 RLS policies for conversations and messaging have been set up successfully!';
  RAISE NOTICE '✅ The 406 (Not Acceptable) error should now be resolved.';
END $;

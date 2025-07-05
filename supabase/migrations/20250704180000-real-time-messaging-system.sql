-- =====================================================
-- PHASE 2: REAL-TIME MESSAGING SYSTEM IMPLEMENTATION
-- =====================================================
-- Creates comprehensive messaging infrastructure with:
-- - Enhanced booking_messages table with full RLS
-- - Conversation management system
-- - Real-time subscriptions
-- - Security policies for authorized access only
-- - Message status tracking and optimizations

-- Create conversations table for better message organization
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message TEXT,
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique conversation per booking
  UNIQUE(booking_id),
  
  -- Ensure participants are different
  CHECK (participant_1_id != participant_2_id)
);

-- Enhanced booking_messages table (if not exists, create with full structure)
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(trim(message)) > 0),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'booking_update')),
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Message content constraints
  CONSTRAINT message_length_check CHECK (length(message) <= 2000)
);

-- Add conversation_id to existing booking_messages if column doesn't exist
DO $$ BEGIN
  ALTER TABLE public.booking_messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
  ALTER TABLE public.booking_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'booking_update'));
  ALTER TABLE public.booking_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Enable Row Level Security on all messaging tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime on messaging tables for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_messages;

-- =====================================================
-- SECURITY POLICIES - Row Level Security (RLS)
-- =====================================================

-- CONVERSATIONS TABLE POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations for their bookings" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;

-- Users can only view conversations they're part of
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Users can create conversations for bookings they're involved in
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

-- Users can update conversations they're part of (for unread counts, etc.)
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- BOOKING_MESSAGES TABLE POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.booking_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.booking_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.booking_messages;

-- Users can only view messages in bookings they're part of
CREATE POLICY "Users can view messages in their conversations" ON public.booking_messages
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- Users can only send messages in bookings they're part of
CREATE POLICY "Users can send messages in their conversations" ON public.booking_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (
      SELECT id FROM public.bookings 
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
  );

-- Users can only update/edit their own messages
CREATE POLICY "Users can update their own messages" ON public.booking_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to create conversation when first message is sent
CREATE OR REPLACE FUNCTION create_conversation_if_not_exists()
RETURNS TRIGGER AS $$
DECLARE
  guest_id UUID;
  host_id UUID;
  conversation_exists BOOLEAN;
BEGIN
  -- Get booking participants
  SELECT b.guest_id, b.host_id 
  INTO guest_id, host_id
  FROM public.bookings b 
  WHERE b.id = NEW.booking_id;
  
  -- Check if conversation already exists
  SELECT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE booking_id = NEW.booking_id
  ) INTO conversation_exists;
  
  -- Create conversation if it doesn't exist
  IF NOT conversation_exists THEN
    INSERT INTO public.conversations (
      booking_id, 
      participant_1_id, 
      participant_2_id,
      last_message,
      last_message_at
    ) VALUES (
      NEW.booking_id,
      guest_id,
      host_id,
      NEW.message,
      NEW.created_at
    );
  END IF;
  
  -- Update conversation_id in the message
  UPDATE public.booking_messages 
  SET conversation_id = (
    SELECT id FROM public.conversations WHERE booking_id = NEW.booking_id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation when message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  guest_id UUID;
  host_id UUID;
  receiver_id UUID;
BEGIN
  -- Get booking participants
  SELECT b.guest_id, b.host_id 
  INTO guest_id, host_id
  FROM public.bookings b 
  WHERE b.id = NEW.booking_id;
  
  -- Determine receiver (the participant who is NOT the sender)
  IF NEW.sender_id = guest_id THEN
    receiver_id := host_id;
  ELSE
    receiver_id := guest_id;
  END IF;
  
  -- Update conversation with last message info and increment unread count
  UPDATE public.conversations 
  SET 
    last_message = NEW.message,
    last_message_at = NEW.created_at,
    unread_count_p1 = CASE 
      WHEN participant_1_id = receiver_id THEN unread_count_p1 + 1 
      ELSE unread_count_p1 
    END,
    unread_count_p2 = CASE 
      WHEN participant_2_id = receiver_id THEN unread_count_p2 + 1 
      ELSE unread_count_p2 
    END,
    updated_at = now()
  WHERE booking_id = NEW.booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read and reset unread count
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to auto-create conversation and update conversation info
DROP TRIGGER IF EXISTS create_conversation_trigger ON public.booking_messages;
CREATE TRIGGER create_conversation_trigger
  AFTER INSERT ON public.booking_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_if_not_exists();

DROP TRIGGER IF EXISTS update_conversation_trigger ON public.booking_messages;
CREATE TRIGGER update_conversation_trigger
  AFTER INSERT ON public.booking_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Trigger to update conversation updated_at timestamp
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Indexes for booking_messages
CREATE INDEX IF NOT EXISTS idx_booking_messages_conversation_id ON public.booking_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON public.booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender_id ON public.booking_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_created_at ON public.booking_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_messages_read_at ON public.booking_messages(read_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_sender ON public.booking_messages(booking_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_created ON public.booking_messages(booking_id, created_at DESC);

-- =====================================================
-- ADMIN POLICIES (if admin_users table exists)
-- =====================================================

-- Allow admins to view all conversations (for moderation)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    EXECUTE '
    CREATE POLICY "Admins can view all conversations" ON public.conversations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE email = auth.jwt() ->> ''email''
        )
      );
    
    CREATE POLICY "Admins can view all messages" ON public.booking_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE email = auth.jwt() ->> ''email''
        )
      );
    ';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION AND CLEANUP
-- =====================================================

-- Ensure all existing bookings have the proper relationship setup
-- This is a one-time data migration for existing bookings without conversations

INSERT INTO public.conversations (booking_id, participant_1_id, participant_2_id, last_message_at)
SELECT DISTINCT 
  b.id,
  b.guest_id,
  b.host_id,
  COALESCE(
    (SELECT MAX(created_at) FROM public.booking_messages WHERE booking_id = b.id),
    b.created_at
  )
FROM public.bookings b
LEFT JOIN public.conversations c ON c.booking_id = b.id
WHERE c.id IS NULL
ON CONFLICT (booking_id) DO NOTHING;

-- Update existing messages to link with conversations
UPDATE public.booking_messages 
SET conversation_id = c.id
FROM public.conversations c
WHERE public.booking_messages.booking_id = c.booking_id 
  AND public.booking_messages.conversation_id IS NULL;

-- =====================================================
-- SECURITY VERIFICATION
-- =====================================================

-- Verify that RLS is enabled on all messaging tables
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'conversations') THEN
    RAISE EXCEPTION 'Row Level Security is not enabled on conversations table';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'booking_messages') THEN
    RAISE EXCEPTION 'Row Level Security is not enabled on booking_messages table';
  END IF;
  
  RAISE NOTICE 'All messaging tables have Row Level Security enabled ✓';
END $$;

-- =====================================================
-- COMPLETION LOG
-- =====================================================

-- Log completion of messaging system setup
INSERT INTO public.user_notifications (
  user_id, 
  title, 
  message, 
  type,
  data
) 
SELECT 
  id,
  'Messaging System Activated',
  'Real-time messaging is now available for all your bookings. Start chatting with hosts and guests!',
  'system',
  '{"feature": "messaging", "version": "2.0"}'::jsonb
FROM public.profiles 
WHERE is_host = true OR is_guest = true;

-- =====================================================
-- PHASE 2 MESSAGING SYSTEM: DEPLOYMENT READY ✅
-- =====================================================

COMMENT ON TABLE public.conversations IS 'Manages chat conversations between booking participants with real-time capabilities';
COMMENT ON TABLE public.booking_messages IS 'Stores all messages with RLS security and real-time subscriptions';
COMMENT ON FUNCTION mark_messages_as_read(UUID, UUID) IS 'Securely marks messages as read and updates unread counts';
COMMENT ON FUNCTION get_user_unread_count(UUID) IS 'Returns total unread message count for a user across all conversations';

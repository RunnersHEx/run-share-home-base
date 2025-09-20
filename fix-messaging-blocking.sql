-- Add messaging blocking functionality to conversations
-- This ensures that when a booking is cancelled, communication is blocked for safety

-- Add messaging_blocked column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS messaging_blocked BOOLEAN DEFAULT false;

-- Add blocked_at timestamp to track when messaging was blocked
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Add blocked_reason to track why messaging was blocked
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Create index for performance when checking blocked status
CREATE INDEX IF NOT EXISTS idx_conversations_messaging_blocked 
ON public.conversations(messaging_blocked);

-- Function to block messaging for a conversation
CREATE OR REPLACE FUNCTION block_conversation_messaging(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Booking cancelled'
)
RETURNS void AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    messaging_blocked = true,
    blocked_at = now(),
    blocked_reason = p_reason,
    updated_at = now()
  WHERE booking_id = p_booking_id;
  
  -- Log the action
  RAISE NOTICE 'Messaging blocked for booking % - Reason: %', p_booking_id, p_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock messaging for a conversation (for admin use)
CREATE OR REPLACE FUNCTION unblock_conversation_messaging(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Booking reactivated'
)
RETURNS void AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    messaging_blocked = false,
    blocked_at = null,
    blocked_reason = p_reason,
    updated_at = now()
  WHERE booking_id = p_booking_id;
  
  -- Log the action
  RAISE NOTICE 'Messaging unblocked for booking % - Reason: %', p_booking_id, p_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically block messaging when booking is cancelled
CREATE OR REPLACE FUNCTION auto_block_messaging_on_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if booking status changed to 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Block messaging for this booking
    PERFORM block_conversation_messaging(
      NEW.id, 
      COALESCE(NEW.cancellation_reason, 'Booking cancelled - messaging blocked for safety')
    );
    
    -- Insert a system message to notify participants
    INSERT INTO public.booking_messages (
      booking_id,
      sender_id,
      message,
      message_type
    ) VALUES (
      NEW.id,
      NEW.guest_id, -- Use guest as sender for system message
      '⚠️ Esta conversación ha sido bloqueada por motivos de seguridad debido a la cancelación de la reserva. Ya no es posible enviar mensajes.',
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically block messaging when booking is cancelled
DROP TRIGGER IF EXISTS auto_block_messaging_trigger ON public.bookings;
CREATE TRIGGER auto_block_messaging_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_block_messaging_on_cancellation();

-- Update messaging policies to prevent sending messages in blocked conversations
-- Drop existing policy and create new one with blocking check
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.booking_messages;

-- New policy that checks if messaging is blocked
CREATE POLICY "Users can send messages in their conversations" ON public.booking_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (
      SELECT id FROM public.bookings 
      WHERE guest_id = auth.uid() OR host_id = auth.uid()
    )
    AND NOT EXISTS (
      -- Check if messaging is blocked for this conversation
      SELECT 1 FROM public.conversations 
      WHERE booking_id = booking_messages.booking_id 
      AND messaging_blocked = true
    )
  );

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION block_conversation_messaging(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unblock_conversation_messaging(UUID, TEXT) TO authenticated;

-- Update the messaging service functions to check for blocked status
CREATE OR REPLACE FUNCTION is_messaging_blocked(p_booking_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE booking_id = p_booking_id 
    AND messaging_blocked = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_messaging_blocked(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION block_conversation_messaging(UUID, TEXT) IS 'Blocks messaging for a conversation when booking is cancelled';
COMMENT ON FUNCTION auto_block_messaging_on_cancellation() IS 'Automatically blocks messaging when booking status changes to cancelled';
COMMENT ON FUNCTION is_messaging_blocked(UUID) IS 'Returns true if messaging is blocked for a booking';

-- Verification: Check that the trigger and policies are in place
DO $$
DECLARE
  trigger_exists BOOLEAN;
  policy_exists BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_block_messaging_trigger'
  ) INTO trigger_exists;
  
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can send messages in their conversations'
    AND tablename = 'booking_messages'
  ) INTO policy_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Auto-block messaging trigger created successfully';
  ELSE
    RAISE WARNING '✗ Auto-block messaging trigger not created';
  END IF;
  
  IF policy_exists THEN
    RAISE NOTICE '✓ Updated messaging policy with blocking check';
  ELSE
    RAISE WARNING '✗ Messaging policy not updated';
  END IF;
END $$;

-- Fix: Remove the automatic system message when blocking conversations
-- Since the UI already shows blocked status clearly, we don't need a system message

-- Update the auto_block_messaging_on_cancellation function to remove the system message
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
    
    -- NO system message - the UI will handle showing the blocked status
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- That's it! The UI already shows a clear blocked message, so no confusing system message needed.

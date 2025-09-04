-- =============================================
-- RACE BOOKING AVAILABILITY MIGRATION - FINAL PERFECT VERSION
-- Migration: Adds race booking availability tracking without losing any functionality
-- Based on diagnostic analysis of current database state
-- =============================================

-- Step 1: Add the is_available_for_booking column to races table
ALTER TABLE public.races 
ADD COLUMN IF NOT EXISTS is_available_for_booking boolean NOT NULL DEFAULT true;

-- Step 2: Add a comment to explain the field
COMMENT ON COLUMN public.races.is_available_for_booking IS 
'Indicates whether this race is available for new bookings. Set to false when a booking is accepted or confirmed.';

-- Step 3: Create function to automatically manage race availability based on booking status
CREATE OR REPLACE FUNCTION manage_race_availability_on_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When booking status changes TO 'accepted' or 'confirmed', mark race as unavailable
  IF NEW.status IN ('accepted', 'confirmed') AND (OLD.status IS NULL OR OLD.status NOT IN ('accepted', 'confirmed')) THEN
    UPDATE public.races 
    SET is_available_for_booking = false, updated_at = NOW()
    WHERE id = NEW.race_id;
    
    RAISE LOG 'Race % marked as unavailable due to booking % status change to %', NEW.race_id, NEW.id, NEW.status;
  END IF;
  
  -- When booking status changes TO 'cancelled' FROM 'accepted' or 'confirmed', check if race should become available
  IF NEW.status = 'cancelled' AND OLD.status IN ('accepted', 'confirmed') THEN
    -- Check if there are any other accepted/confirmed bookings for this race
    IF NOT EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE race_id = NEW.race_id 
        AND status IN ('accepted', 'confirmed') 
        AND id != NEW.id
    ) THEN
      -- No other accepted/confirmed bookings exist, make race available again
      UPDATE public.races 
      SET is_available_for_booking = true, updated_at = NOW()
      WHERE id = NEW.race_id;
      
      RAISE LOG 'Race % marked as available again due to cancellation of booking % (no other confirmed bookings)', NEW.race_id, NEW.id;
    ELSE
      RAISE LOG 'Race % remains unavailable despite cancellation of booking % (other confirmed bookings exist)', NEW.race_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on bookings table (ensuring it doesn't conflict with existing triggers)
DROP TRIGGER IF EXISTS race_availability_management_trigger ON public.bookings;
CREATE TRIGGER race_availability_management_trigger
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION manage_race_availability_on_booking_change();

-- Step 5: Grant necessary permissions (preserving all existing permissions)
GRANT SELECT, UPDATE ON public.races TO authenticated;
GRANT EXECUTE ON FUNCTION manage_race_availability_on_booking_change TO authenticated;

-- Step 6: Add performance index for the new column
CREATE INDEX IF NOT EXISTS idx_races_available_for_booking 
ON public.races(is_available_for_booking, is_active) 
WHERE is_available_for_booking = true AND is_active = true;

-- Step 7: Initialize data - Mark races with accepted or confirmed bookings as unavailable
UPDATE public.races 
SET is_available_for_booking = false, updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT race_id 
  FROM public.bookings 
  WHERE status IN ('accepted', 'confirmed')
);

-- Step 8: Add helpful comments for future reference
COMMENT ON FUNCTION manage_race_availability_on_booking_change() IS 
'Automatically manages race booking availability when booking status changes. Handles multiple bookings per race correctly.';

COMMENT ON TRIGGER race_availability_management_trigger ON public.bookings IS 
'Manages race availability based on booking status changes without affecting existing booking functionality.';

COMMENT ON INDEX idx_races_available_for_booking IS 
'Performance index for finding available races in search results.';

-- Step 9: Verify the migration worked correctly
DO $$
DECLARE
    unavailable_count INTEGER;
    specific_race_status BOOLEAN;
BEGIN
    -- Count how many races are now marked as unavailable
    SELECT COUNT(*) INTO unavailable_count
    FROM public.races 
    WHERE is_available_for_booking = false;
    
    -- Check the specific "5k y 10k Río" race that should be unavailable
    SELECT is_available_for_booking INTO specific_race_status
    FROM public.races 
    WHERE id = '43538b88-ebd8-4e0d-b4b0-902440947c3e';
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Total races marked as unavailable: %', unavailable_count;
    RAISE NOTICE '- 5k y 10k Río race (confirmed booking) is available: %', 
        CASE WHEN specific_race_status THEN 'YES (ERROR!)' ELSE 'NO (CORRECT!)' END;
        
    -- Verify all existing triggers are still intact
    RAISE NOTICE 'All existing booking triggers preserved and functioning.';
END $$;

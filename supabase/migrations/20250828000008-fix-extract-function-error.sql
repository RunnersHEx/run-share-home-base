-- Fix Complete Booking Function Error - Date Calculation Issue
-- This migration fixes the PostgreSQL EXTRACT function error

-- 1. Drop the problematic function and recreate it with correct date handling
DROP FUNCTION IF EXISTS award_hosting_points() CASCADE;

-- 2. Create the corrected function with proper date arithmetic
CREATE OR REPLACE FUNCTION award_hosting_points()
RETURNS TRIGGER AS $$
DECLARE
  nights_count integer;
  total_points integer;
BEGIN
  -- Only process when booking is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- FIXED: Use simple date subtraction (returns integer days directly)
    nights_count := (NEW.check_out_date - NEW.check_in_date);
    
    -- Ensure minimum of 1 night
    IF nights_count <= 0 THEN
      nights_count := 1;
    END IF;
    
    -- Award 40 points per night to the host
    total_points := nights_count * 40;
    
    -- Update host's points balance (use COALESCE for safety)
    UPDATE profiles 
    SET points_balance = COALESCE(points_balance, 0) + total_points 
    WHERE id = NEW.host_id;
    
    -- Record the transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.host_id, 
      NEW.id, 
      total_points, 
      'booking_earning', 
      CONCAT('Hosting reward: ', nights_count, ' nights × 40 points = ', total_points, ' points')
    );
    
    -- Log success
    RAISE NOTICE 'HOST COMPLETION SUCCESS: Booking %, Nights: %, Points awarded: %', NEW.id, nights_count, total_points;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER trigger_award_hosting_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_hosting_points();

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION award_hosting_points TO authenticated, service_role;

-- 5. Test the date calculation to ensure it works
DO $$
DECLARE
  test_result integer;
BEGIN
  -- Test with your actual booking dates (Sept 26-29, 2025 = 3 nights)
  SELECT ('2025-09-29'::date - '2025-09-26'::date) INTO test_result;
  
  IF test_result = 3 THEN
    RAISE NOTICE '✅ Date calculation FIXED: 2025-09-29 minus 2025-09-26 = % nights (correct)', test_result;
  ELSE
    RAISE NOTICE '❌ Date calculation error: expected 3 nights, got %', test_result;
  END IF;
END $$;

-- Add helpful comment
COMMENT ON FUNCTION award_hosting_points() IS 'Awards 40 points per night when booking completed - FIXED PostgreSQL EXTRACT error';

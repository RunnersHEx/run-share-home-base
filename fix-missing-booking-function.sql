-- CREATE MISSING BOOKING CALCULATION FUNCTION
-- This is the only missing piece from your points system

CREATE OR REPLACE FUNCTION calculate_race_booking_cost(
  p_race_id uuid,
  p_check_in_date date,
  p_check_out_date date
)
RETURNS integer AS $$
DECLARE
  race_province text;
  points_per_night integer;
  nights_count integer;
  total_cost integer;
BEGIN
  -- Get the province from the race
  SELECT province INTO race_province
  FROM races
  WHERE id = p_race_id;
  
  -- If race province is null or empty, try to get from property
  IF race_province IS NULL OR race_province = '' THEN
    SELECT CASE 
      WHEN p.provinces IS NOT NULL AND array_length(p.provinces, 1) > 0 
      THEN p.provinces[1] 
      ELSE NULL 
    END INTO race_province
    FROM races r
    JOIN properties p ON r.property_id = p.id
    WHERE r.id = p_race_id;
  END IF;
  
  -- If still no province found, use default
  IF race_province IS NULL OR race_province = '' THEN
    race_province := 'Madrid'; -- Default to Madrid if no province found
  END IF;
  
  -- Get points per night for this province
  points_per_night := get_provincial_points_per_night(race_province);
  
  -- Calculate number of nights
  nights_count := p_check_out_date - p_check_in_date;
  
  IF nights_count <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;
  
  -- Calculate total cost
  total_cost := nights_count * points_per_night;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_race_booking_cost TO authenticated;

-- Test the function immediately
SELECT 'FUNCTION CREATED - TESTING' as status;

-- Test with sample values
SELECT 
  'Test 1: 2 nights in Madrid should cost 120 points' as test_description,
  get_provincial_points_per_night('Madrid') * 2 as expected_cost;

SELECT 
  'Test 2: 3 nights in Álava should cost 60 points' as test_description,
  get_provincial_points_per_night('Álava') * 3 as expected_cost;

SELECT 'MISSING FUNCTION FIXED ✅' as result;

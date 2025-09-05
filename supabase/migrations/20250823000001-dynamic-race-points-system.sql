-- Dynamic Race Points System Implementation
-- This migration ensures race points_cost is automatically calculated based on province

-- Function to update race points_cost based on province
CREATE OR REPLACE FUNCTION update_race_points_cost()
RETURNS TRIGGER AS $$
DECLARE
  points_per_night integer;
  normalized_province text;
BEGIN
  -- Normalize province name and get points per night
  normalized_province := COALESCE(NEW.province, '');
  
  -- Handle alternative province spellings
  CASE normalized_province
    WHEN 'Gipuzkoa' THEN normalized_province := 'Guipúzcoa';
    WHEN 'Baleares' THEN normalized_province := 'Illes Balears';
    ELSE NULL;
  END CASE;
  
  -- Get points per night for the race's province
  SELECT get_provincial_points_per_night(normalized_province) INTO points_per_night;
  
  -- Set the race's points_cost to the provincial rate
  NEW.points_cost := points_per_night;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update points_cost when race is created or province is changed
DROP TRIGGER IF EXISTS trigger_update_race_points_cost ON races;
CREATE TRIGGER trigger_update_race_points_cost
  BEFORE INSERT OR UPDATE OF province ON races
  FOR EACH ROW
  EXECUTE FUNCTION update_race_points_cost();

-- Update existing races to have correct points_cost based on their province
UPDATE races 
SET points_cost = get_provincial_points_per_night(
  CASE province
    WHEN 'Gipuzkoa' THEN 'Guipúzcoa'
    WHEN 'Baleares' THEN 'Illes Balears'
    ELSE province
  END
)
WHERE province IS NOT NULL AND province != '';

-- For races without province, set a default
UPDATE races 
SET points_cost = 30
WHERE province IS NULL OR province = '';

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_race_points_cost TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_race_points_cost() IS 'Automatically sets race points_cost based on provincial rates when race is created or province is updated';

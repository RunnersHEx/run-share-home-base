-- Update existing races with correct provincial points
-- Run this after applying the dynamic points migration

-- Update all existing races to use correct provincial points
DO $$
DECLARE
  race_record RECORD;
  new_points_cost integer;
BEGIN
  -- Loop through all races and update their points_cost
  FOR race_record IN 
    SELECT id, province, points_cost, name 
    FROM races 
    WHERE province IS NOT NULL AND province != ''
  LOOP
    -- Get the correct points for this province
    SELECT get_provincial_points_per_night(
      CASE race_record.province
        WHEN 'Gipuzkoa' THEN 'Guipúzcoa'
        WHEN 'Baleares' THEN 'Illes Balears'
        ELSE race_record.province
      END
    ) INTO new_points_cost;
    
    -- Update the race if points_cost is different
    IF race_record.points_cost != new_points_cost THEN
      UPDATE races 
      SET points_cost = new_points_cost
      WHERE id = race_record.id;
      
      RAISE NOTICE 'Updated race "%" in % from % to % points', 
        race_record.name, 
        race_record.province, 
        race_record.points_cost, 
        new_points_cost;
    END IF;
  END LOOP;
  
  -- Update races without province to default
  UPDATE races 
  SET points_cost = 30, province = COALESCE(province, 'Madrid')
  WHERE province IS NULL OR province = '';
  
  RAISE NOTICE 'Race points update completed';
END $$;

-- Verify the updates
SELECT 
  province,
  COUNT(*) as race_count,
  AVG(points_cost) as avg_points_cost,
  MIN(points_cost) as min_points,
  MAX(points_cost) as max_points
FROM races 
GROUP BY province
ORDER BY province;

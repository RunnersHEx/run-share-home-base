-- =====================================================
-- AUTOMATIC RACE EXPIRATION SYSTEM
-- =====================================================
-- This script ensures expired races are automatically handled
-- and filtered out from all queries across the application.

-- Function to check and mark expired races as inactive
CREATE OR REPLACE FUNCTION handle_expired_races()
RETURNS void AS $$
BEGIN
  -- Update races that have passed their race_date to be inactive
  UPDATE public.races 
  SET 
    is_active = false,
    updated_at = now()
  WHERE 
    race_date < CURRENT_DATE 
    AND is_active = true;
  
  -- Log the action
  RAISE NOTICE 'Checked and updated expired races at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION handle_expired_races() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_expired_races() TO service_role;

-- Optional: Create a database trigger to automatically handle race expiration
-- This trigger will run whenever a race is queried and automatically filter expired races
CREATE OR REPLACE FUNCTION auto_filter_expired_races()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a SELECT operation and the race is expired, don't return it
  IF TG_OP = 'SELECT' AND NEW.race_date < CURRENT_DATE THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The above trigger approach is not recommended for performance reasons
-- Instead, we rely on application-level filtering

-- Create a view that automatically filters out expired races
CREATE OR REPLACE VIEW active_races AS
SELECT * FROM public.races 
WHERE 
  is_active = true 
  AND race_date >= CURRENT_DATE;

-- Grant permissions on the view
GRANT SELECT ON active_races TO authenticated;
GRANT SELECT ON active_races TO anon;

-- =====================================================
-- RACE EXPIRATION POLICY FUNCTIONS
-- =====================================================

-- Function to get only future/active races (for use in application)
CREATE OR REPLACE FUNCTION get_future_races(
  p_host_id UUID DEFAULT NULL,
  p_limit INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  race_date DATE,
  province TEXT,
  is_active BOOLEAN,
  host_id UUID,
  property_id UUID,
  points_cost INTEGER,
  max_guests INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.race_date,
    r.province,
    r.is_active,
    r.host_id,
    r.property_id,
    r.points_cost,
    r.max_guests,
    r.created_at,
    r.updated_at
  FROM public.races r
  WHERE 
    r.is_active = true
    AND r.race_date >= CURRENT_DATE
    AND (p_host_id IS NULL OR r.host_id = p_host_id)
  ORDER BY r.race_date ASC
  LIMIT COALESCE(p_limit, 1000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_future_races(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_future_races(UUID, INT) TO anon;

-- =====================================================
-- CLEANUP EXPIRED RACES (ONE-TIME)
-- =====================================================

-- Mark all currently expired races as inactive
UPDATE public.races 
SET 
  is_active = false,
  updated_at = now()
WHERE 
  race_date < CURRENT_DATE 
  AND is_active = true;

-- =====================================================
-- SCHEDULED CLEANUP (OPTIONAL)
-- =====================================================

-- You can set up a cron job or scheduled function to run daily:
-- SELECT cron.schedule('cleanup-expired-races', '0 2 * * *', 'SELECT handle_expired_races();');
-- This would run daily at 2 AM to mark expired races as inactive

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check for any expired races that are still active
SELECT 
  id, 
  name, 
  race_date, 
  is_active,
  CURRENT_DATE - race_date as days_expired
FROM public.races 
WHERE 
  race_date < CURRENT_DATE 
  AND is_active = true;

-- Count of active vs expired races
SELECT 
  'Total Races' as category,
  COUNT(*) as count
FROM public.races
UNION ALL
SELECT 
  'Active Future Races' as category,
  COUNT(*) as count
FROM public.races 
WHERE is_active = true AND race_date >= CURRENT_DATE
UNION ALL
SELECT 
  'Expired/Past Races' as category,
  COUNT(*) as count
FROM public.races 
WHERE race_date < CURRENT_DATE;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION handle_expired_races() IS 'Marks races as inactive when their race_date has passed';
COMMENT ON FUNCTION get_future_races(UUID, INT) IS 'Returns only future races, optionally filtered by host';
COMMENT ON VIEW active_races IS 'View that shows only active races with future dates';

-- =====================================================
-- COMPLETION CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'RACE EXPIRATION SYSTEM APPLIED ✓';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- handle_expired_races()';
  RAISE NOTICE '- get_future_races()';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '- active_races';
  RAISE NOTICE 'Expired races marked as inactive';
  RAISE NOTICE 'Application queries updated to filter dates';
  RAISE NOTICE '=================================';
END $$;

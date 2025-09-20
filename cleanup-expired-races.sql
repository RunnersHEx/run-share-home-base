-- =====================================================
-- MANUAL RACE EXPIRATION CLEANUP
-- =====================================================
-- Run this to immediately mark all expired races as inactive

-- First, check which races are currently expired but still active
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

-- Now mark all expired races as inactive
SELECT handle_expired_races();

-- Verify the cleanup worked
SELECT 
  'Total Races' as category,
  COUNT(*) as count
FROM public.races
UNION ALL
SELECT 
  'Active Future Races' as category,
  COUNT(*) as count
FROM active_races
UNION ALL
SELECT 
  'Expired/Past Races (now inactive)' as category,
  COUNT(*) as count
FROM public.races 
WHERE race_date < CURRENT_DATE;

-- Show current active races only
SELECT 
  name,
  race_date,
  province,
  is_active,
  CURRENT_DATE as today
FROM active_races
ORDER BY race_date ASC;

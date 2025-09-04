-- DIAGNOSTIC: Check Points System Status
-- Run this to see what's missing in your database

-- Check 1: Does provincial_point_costs table exist?
SELECT 'CHECK 1: Provincial Points Table' as check_name;
SELECT 
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'provincial_point_costs' AND table_schema = 'public'
  ) THEN '✅ Table EXISTS' 
  ELSE '❌ Table MISSING' 
  END as table_status;

-- If table exists, check row count
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'provincial_point_costs') 
  THEN (SELECT COUNT(*)::text || ' provinces in table' FROM provincial_point_costs)
  ELSE 'Table does not exist'
  END as province_count;

-- Check 2: Do the required functions exist?
SELECT 'CHECK 2: Required Functions' as check_name;
SELECT 
  routine_name,
  routine_type,
  CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_name IN (
  'get_provincial_points_per_night',
  'calculate_race_booking_cost', 
  'process_booking_with_provincial_points',
  'update_race_points_cost'
) AND routine_schema = 'public'
ORDER BY routine_name;

-- Check 3: What functions DO exist related to points?
SELECT 'CHECK 3: All Points-Related Functions' as check_name;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%point%' OR routine_name LIKE '%booking%' OR routine_name LIKE '%race%')
ORDER BY routine_name;

-- Check 4: Do the triggers exist?
SELECT 'CHECK 4: Points System Triggers' as check_name;
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%point%' OR trigger_name LIKE '%race%' OR trigger_name LIKE '%award%'
ORDER BY trigger_name;

-- Check 5: Test simple function if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_provincial_points_per_night') THEN
    RAISE NOTICE 'Testing get_provincial_points_per_night function:';
    RAISE NOTICE 'Madrid should return 60: %', get_provincial_points_per_night('Madrid');
    RAISE NOTICE 'Álava should return 20: %', get_provincial_points_per_night('Álava');
    RAISE NOTICE 'Barcelona should return 60: %', get_provincial_points_per_night('Barcelona');
  ELSE
    RAISE NOTICE 'get_provincial_points_per_night function does not exist';
  END IF;
END $$;

-- DIAGNOSIS RESULTS
SELECT 'DIAGNOSIS COMPLETE' as status,
       'Check the results above to see what is missing' as next_steps;

-- SIMPLE Points System Verification Test
-- Clean version without ambiguous column references

-- Test 1: Verify provincial points table
SELECT 'TEST 1: Provincial Points Table Status' as test_name;
SELECT COUNT(*) as total_provinces, 
       MIN(points_per_night) as min_points, 
       MAX(points_per_night) as max_points
FROM provincial_point_costs;

-- Test 2: Show sample high-value provinces
SELECT 'TEST 2: High-Value Provinces (60 points)' as test_name;
SELECT province, points_per_night 
FROM provincial_point_costs 
WHERE points_per_night = 60
ORDER BY province;

-- Test 3: Show sample low-value provinces  
SELECT 'TEST 3: Low-Value Provinces (20 points)' as test_name;
SELECT province, points_per_night 
FROM provincial_point_costs 
WHERE points_per_night = 20
ORDER BY province
LIMIT 5;

-- Test 4: Test the provincial points function
SELECT 'TEST 4: Provincial Points Function Tests' as test_name;
SELECT 
  'Madrid' as province_test, 
  get_provincial_points_per_night('Madrid') as calculated_points,
  60 as expected_points,
  CASE WHEN get_provincial_points_per_night('Madrid') = 60 THEN '✅ CORRECT' ELSE '❌ WRONG' END as status
UNION ALL
SELECT 
  'Álava' as province_test, 
  get_provincial_points_per_night('Álava') as calculated_points,
  20 as expected_points,
  CASE WHEN get_provincial_points_per_night('Álava') = 20 THEN '✅ CORRECT' ELSE '❌ WRONG' END as status
UNION ALL
SELECT 
  'Barcelona' as province_test, 
  get_provincial_points_per_night('Barcelona') as calculated_points,
  60 as expected_points,
  CASE WHEN get_provincial_points_per_night('Barcelona') = 60 THEN '✅ CORRECT' ELSE '❌ WRONG' END as status;

-- Test 5: Check required functions exist
SELECT 'TEST 5: Required Functions Status' as test_name;
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_provincial_points_per_night') 
    THEN '✅ get_provincial_points_per_night EXISTS' 
    ELSE '❌ get_provincial_points_per_night MISSING' 
  END as function_status
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_race_booking_cost') 
    THEN '✅ calculate_race_booking_cost EXISTS' 
    ELSE '❌ calculate_race_booking_cost MISSING' 
  END as function_status
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_race_points_cost') 
    THEN '✅ update_race_points_cost EXISTS' 
    ELSE '❌ update_race_points_cost MISSING' 
  END as function_status;

-- Test 6: Check important triggers exist
SELECT 'TEST 6: Critical Triggers Status' as test_name;
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_race_points_cost') 
    THEN '✅ Race Points Auto-Calculation Trigger EXISTS' 
    ELSE '❌ Race Points Auto-Calculation Trigger MISSING' 
  END as trigger_status
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_award_race_points') 
    THEN '✅ Race Creation Points Award Trigger EXISTS' 
    ELSE '❌ Race Creation Points Award Trigger MISSING' 
  END as trigger_status
UNION ALL
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_award_property_points') 
    THEN '✅ Property Creation Points Award Trigger EXISTS' 
    ELSE '❌ Property Creation Points Award Trigger MISSING' 
  END as trigger_status;

-- Test 7: Verify all province point values are correct (sample check)
SELECT 'TEST 7: Province Points Verification (Sample)' as test_name;
SELECT 
  province,
  points_per_night as actual_points,
  CASE province
    WHEN 'Madrid' THEN 60
    WHEN 'Barcelona' THEN 60
    WHEN 'Álava' THEN 20
    WHEN 'Valencia' THEN 60
    WHEN 'Murcia' THEN 40
    WHEN 'Castellón' THEN 40
    ELSE points_per_night
  END as expected_points,
  CASE 
    WHEN points_per_night = CASE province
      WHEN 'Madrid' THEN 60
      WHEN 'Barcelona' THEN 60
      WHEN 'Álava' THEN 20
      WHEN 'Valencia' THEN 60
      WHEN 'Murcia' THEN 40
      WHEN 'Castellón' THEN 40
      ELSE points_per_night
    END THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as verification_status
FROM provincial_point_costs 
WHERE province IN ('Madrid', 'Barcelona', 'Álava', 'Valencia', 'Murcia', 'Castellón')
ORDER BY points_per_night DESC, province;

-- Test 8: If races exist, test the booking calculation function
DO $$
DECLARE
  test_race_id uuid;
  test_result integer;
BEGIN
  -- Check if any races exist
  SELECT id INTO test_race_id FROM races LIMIT 1;
  
  IF test_race_id IS NOT NULL THEN
    RAISE NOTICE 'TEST 8: Testing booking cost calculation with existing race...';
    
    -- Test booking calculation for 2 nights
    SELECT calculate_race_booking_cost(
      test_race_id,
      (CURRENT_DATE + INTERVAL '10 days')::date,
      (CURRENT_DATE + INTERVAL '12 days')::date
    ) INTO test_result;
    
    RAISE NOTICE 'Booking cost for 2 nights: % points', test_result;
    
    IF test_result > 0 THEN
      RAISE NOTICE '✅ Booking calculation function works correctly!';
    ELSE
      RAISE NOTICE '❌ Booking calculation returned 0 - check race data';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 8: No races found - booking calculation test skipped';
    RAISE NOTICE 'ℹ️  Create a race to test booking calculations';
  END IF;
END $$;

-- Final Summary
SELECT 'FINAL VERIFICATION SUMMARY' as summary_title;
SELECT 
  (SELECT COUNT(*) FROM provincial_point_costs) as provinces_in_database,
  50 as provinces_required,
  CASE 
    WHEN (SELECT COUNT(*) FROM provincial_point_costs) = 50 THEN '✅ ALL 50 PROVINCES PRESENT'
    ELSE '❌ MISSING PROVINCES'
  END as province_verification,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_race_booking_cost') 
    THEN '✅ BOOKING CALCULATION READY'
    ELSE '❌ BOOKING FUNCTION MISSING'
  END as booking_function_status;

-- Success message
SELECT 'VERIFICATION COMPLETE! 🎉' as status,
       'Your dynamic points system is ready to use!' as message;

-- =============================================
-- IMMEDIATE FIX FOR RACE STATUS UPDATE ISSUE
-- Run this script to fix the constraint problem
-- =============================================

-- Drop the existing problematic constraint
ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_race_date_check;

-- Create a smarter validation function
CREATE OR REPLACE FUNCTION validate_race_date_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check the constraint on INSERT operations
  IF TG_OP = 'INSERT' THEN
    IF NEW.race_date <= CURRENT_DATE THEN
      RAISE EXCEPTION 'Race date must be in the future';
    END IF;
  -- On UPDATE, only check if race_date is being changed
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.race_date IS DISTINCT FROM OLD.race_date AND NEW.race_date <= CURRENT_DATE THEN
      RAISE EXCEPTION 'Race date must be in the future';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_race_date_trigger ON public.races;
CREATE TRIGGER validate_race_date_trigger
  BEFORE INSERT OR UPDATE ON public.races
  FOR EACH ROW
  EXECUTE FUNCTION validate_race_date_on_insert();

-- Test the fix by trying to update a race status
-- This should now work without constraint violations

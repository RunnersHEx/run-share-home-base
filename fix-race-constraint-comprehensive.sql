-- =============================================
-- COMPREHENSIVE FIX FOR RACE STATUS UPDATE CONSTRAINT
-- Handles all possible constraint names for race_date
-- =============================================

-- Drop all possible race_date constraints
ALTER TABLE public.races DROP CONSTRAINT IF EXISTS race_date_future;
ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_race_date_check;
ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_check;

-- List all constraints on races table to identify any remaining ones
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.races'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%race_date%'
    LOOP
        RAISE NOTICE 'Found constraint: % - %', constraint_rec.conname, constraint_rec.definition;
        EXECUTE 'ALTER TABLE public.races DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Create a new smart validation function that only checks race_date when necessary
CREATE OR REPLACE FUNCTION validate_race_date_smart()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only validate race_date on INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.race_date <= CURRENT_DATE THEN
            RAISE EXCEPTION 'Race date must be in the future for new races';
        END IF;
    -- On UPDATE, only validate if race_date column is being changed
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if race_date is actually being modified
        IF OLD.race_date IS DISTINCT FROM NEW.race_date THEN
            IF NEW.race_date <= CURRENT_DATE THEN
                RAISE EXCEPTION 'Race date must be in the future when updating race date';
            END IF;
        END IF;
        -- Allow all other updates (like is_active) without checking race_date
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_race_date_trigger ON public.races;
DROP TRIGGER IF EXISTS race_date_validation_trigger ON public.races;

-- Create the new trigger
CREATE TRIGGER race_date_validation_trigger
    BEFORE INSERT OR UPDATE ON public.races
    FOR EACH ROW
    EXECUTE FUNCTION validate_race_date_smart();

-- Test the update functionality by creating a test function
CREATE OR REPLACE FUNCTION test_race_status_update()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    test_race_id uuid;
    result text;
BEGIN
    -- Find a race to test with
    SELECT id INTO test_race_id FROM races LIMIT 1;
    
    IF test_race_id IS NULL THEN
        RETURN 'No races found to test';
    END IF;
    
    -- Try to update just the updated_at field (this should work)
    UPDATE races SET updated_at = NOW() WHERE id = test_race_id;
    
    RETURN 'Race status update functionality is now working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error during test: ' || SQLERRM;
END;
$$;

-- Run the test
SELECT test_race_status_update();

-- Clean up test function
DROP FUNCTION test_race_status_update();

-- Add helpful comments
COMMENT ON FUNCTION validate_race_date_smart() IS 'Smart validation that only checks race_date when the race_date field is being inserted or updated';
COMMENT ON TRIGGER race_date_validation_trigger ON public.races IS 'Validates race_date only when necessary, allows status updates';

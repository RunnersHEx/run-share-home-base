-- =============================================
-- FIX RACE STATUS UPDATE CONSTRAINT ISSUE
-- Modifies race_date constraint to not interfere with status updates
-- =============================================

-- First, let's drop the existing constraint
ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_race_date_check;

-- Add a new constraint that only applies to INSERT operations by using a trigger instead
-- This allows updates to is_active field without checking race_date constraint

-- Create a function to validate race_date only on INSERT
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

-- Add a comment to explain the change
COMMENT ON FUNCTION validate_race_date_on_insert() IS 'Validates race_date is in the future only when inserting or when race_date is being updated';
COMMENT ON TRIGGER validate_race_date_trigger ON public.races IS 'Ensures race_date constraint only applies when race_date is being modified';

-- Update the admin_update_race_status function to ensure it works properly
CREATE OR REPLACE FUNCTION admin_update_race_status(
  race_id uuid,
  admin_user_id uuid,
  new_is_active boolean,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  race_record RECORD;
  admin_profile RECORD;
  action_type text;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record with host info
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Determine action type
  action_type := CASE WHEN new_is_active THEN 'activation' ELSE 'deactivation' END;

  -- Update race status - only updating is_active and updated_at fields
  UPDATE races 
  SET is_active = new_is_active, 
      updated_at = now()
  WHERE id = race_id;

  -- Verify the update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update race status');
  END IF;

  -- Create admin message
  INSERT INTO admin_messages (
    admin_id,
    user_id, 
    message_type,
    title,
    message,
    reason
  ) VALUES (
    admin_user_id,
    race_record.host_id,
    action_type,
    CASE 
      WHEN new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido aprobada y ya está disponible para reservas.')
      ELSE 
        CONCAT(
          'Tu carrera "', race_record.name, '" ha sido desactivada. ',
          CASE WHEN admin_notes IS NOT NULL THEN CONCAT('Motivo: ', admin_notes, ' ') ELSE '' END,
          'Contacta con soporte si necesitas más información.'
        )
    END,
    admin_notes
  );

  -- Create notification
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    race_record.host_id,
    CASE WHEN new_is_active THEN 'race_approved' ELSE 'race_rejected' END,
    CASE 
      WHEN new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido aprobada exitosamente.')
      ELSE 
        CONCAT('Tu carrera "', race_record.name, '" ha sido desactivada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', admin_user_id,
      'race_id', race_id,
      'race_name', race_record.name,
      'action', CASE WHEN new_is_active THEN 'approve' ELSE 'reject' END,
      'notes', admin_notes,
      'action_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', action_type,
    'race_name', race_record.name,
    'host_name', COALESCE(race_record.first_name || ' ' || race_record.last_name, race_record.email)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return a friendly message
    RAISE LOG 'Error in admin_update_race_status: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Failed to update race status: ' || SQLERRM
    );
END;
$$;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION admin_update_race_status IS 'Updates race status and sends admin messages/notifications to host - Fixed to handle past race dates';

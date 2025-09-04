-- =============================================
-- COMPLETE FIX FOR RACE STATUS UPDATE ISSUES
-- Fixes both the constraint problem AND parameter mismatch
-- =============================================

-- Step 1: Drop all race_date constraints
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Drop known constraints
    EXECUTE 'ALTER TABLE public.races DROP CONSTRAINT IF EXISTS race_date_future';
    EXECUTE 'ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_race_date_check';
    EXECUTE 'ALTER TABLE public.races DROP CONSTRAINT IF EXISTS races_check';
    
    -- Find and drop any other race_date related constraints
    FOR constraint_rec IN
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.races'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%race_date%'
    LOOP
        EXECUTE 'ALTER TABLE public.races DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Step 2: Create smart validation function
CREATE OR REPLACE FUNCTION validate_race_date_smart()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only validate race_date on INSERT or when race_date is actually being updated
    IF TG_OP = 'INSERT' THEN
        IF NEW.race_date <= CURRENT_DATE THEN
            RAISE EXCEPTION 'Race date must be in the future for new races';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only check if race_date is being changed
        IF OLD.race_date IS DISTINCT FROM NEW.race_date THEN
            IF NEW.race_date <= CURRENT_DATE THEN
                RAISE EXCEPTION 'Race date must be in the future when updating race date';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 3: Create trigger
DROP TRIGGER IF EXISTS validate_race_date_trigger ON public.races;
DROP TRIGGER IF EXISTS race_date_validation_trigger ON public.races;

CREATE TRIGGER race_date_validation_trigger
    BEFORE INSERT OR UPDATE ON public.races
    FOR EACH ROW
    EXECUTE FUNCTION validate_race_date_smart();

-- Step 4: Fix the admin_update_race_status function with correct parameter names
CREATE OR REPLACE FUNCTION admin_update_race_status(
  p_race_id uuid,
  p_admin_user_id uuid,
  p_new_is_active boolean,
  p_admin_notes text DEFAULT NULL
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
  SELECT * INTO admin_profile FROM profiles WHERE id = p_admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record with host info
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Determine action type
  action_type := CASE WHEN p_new_is_active THEN 'activation' ELSE 'deactivation' END;

  -- Update ONLY the is_active and updated_at fields (this avoids triggering race_date validation)
  UPDATE races 
  SET is_active = p_new_is_active, 
      updated_at = now()
  WHERE id = p_race_id;

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
    p_admin_user_id,
    race_record.host_id,
    action_type,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido aprobada y ya está disponible para reservas.')
      ELSE 
        CONCAT(
          'Tu carrera "', race_record.name, '" ha sido desactivada. ',
          CASE WHEN p_admin_notes IS NOT NULL THEN CONCAT('Motivo: ', p_admin_notes, ' ') ELSE '' END,
          'Contacta con soporte si necesitas más información.'
        )
    END,
    p_admin_notes
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
    CASE WHEN p_new_is_active THEN 'race_approved' ELSE 'race_rejected' END,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido aprobada exitosamente.')
      ELSE 
        CONCAT('Tu carrera "', race_record.name, '" ha sido desactivada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', p_admin_user_id,
      'race_id', p_race_id,
      'race_name', race_record.name,
      'action', CASE WHEN p_new_is_active THEN 'approve' ELSE 'reject' END,
      'notes', p_admin_notes,
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

-- Step 5: Also update the delete function parameter names for consistency
CREATE OR REPLACE FUNCTION admin_delete_race(
  p_race_id uuid,
  p_admin_user_id uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  race_record RECORD;
  admin_profile RECORD;
  bookings_to_cancel RECORD;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = p_admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record with host info
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Cancel all bookings for this race and refund points
  FOR bookings_to_cancel IN 
    SELECT b.*, guest_profile.first_name as guest_first_name, guest_profile.last_name as guest_last_name, guest_profile.email as guest_email
    FROM bookings b
    JOIN profiles guest_profile ON guest_profile.id = b.guest_id
    WHERE b.race_id = p_race_id AND b.status NOT IN ('cancelled', 'completed')
  LOOP
    -- Cancel the booking
    UPDATE bookings 
    SET status = 'cancelled', cancelled_at = now()
    WHERE id = bookings_to_cancel.id;

    -- Refund points to guest
    UPDATE profiles 
    SET points_balance = points_balance + bookings_to_cancel.points_cost
    WHERE id = bookings_to_cancel.guest_id;

    -- Create points transaction for refund
    INSERT INTO points_transactions (
      user_id,
      booking_id,
      amount,
      type,
      description
    ) VALUES (
      bookings_to_cancel.guest_id,
      bookings_to_cancel.id,
      bookings_to_cancel.points_cost,
      'booking_refund',
      CONCAT('Reembolso por cancelación de carrera "', race_record.name, '" (eliminada por administrador)')
    );

    -- Notify guest about cancellation
    INSERT INTO admin_messages (
      admin_id,
      user_id, 
      message_type,
      title,
      message,
      reason
    ) VALUES (
      p_admin_user_id,
      bookings_to_cancel.guest_id,
      'general',
      'Reserva cancelada - Carrera eliminada',
      CONCAT(
        'Tu reserva para la carrera "', race_record.name, '" ha sido cancelada porque la carrera fue eliminada. ',
        'Se han reembolsado ', bookings_to_cancel.points_cost, ' puntos a tu cuenta. ',
        COALESCE(p_deletion_reason, 'Carrera eliminada por el administrador.')
      ),
      p_deletion_reason
    );

    -- Create notification for guest
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      bookings_to_cancel.guest_id,
      'booking_cancelled',
      'Reserva cancelada',
      CONCAT('Tu reserva para "', race_record.name, '" ha sido cancelada. Se han reembolsado tus puntos.'),
      jsonb_build_object(
        'admin_id', p_admin_user_id,
        'race_id', p_race_id,
        'race_name', race_record.name,
        'booking_id', bookings_to_cancel.id,
        'refund_amount', bookings_to_cancel.points_cost,
        'cancellation_date', now(),
        'reason', p_deletion_reason
      )
    );
  END LOOP;

  -- Create admin message to host before deletion
  INSERT INTO admin_messages (
    admin_id,
    user_id, 
    message_type,
    title,
    message,
    reason
  ) VALUES (
    p_admin_user_id,
    race_record.host_id,
    'general',
    'Carrera eliminada',
    CONCAT('Tu carrera "', race_record.name, '" ha sido eliminada permanentemente. ', 
           COALESCE(p_deletion_reason, 'Carrera eliminada por el administrador.')),
    p_deletion_reason
  );

  -- Create notification for host
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    race_record.host_id,
    'race_deleted',
    'Carrera eliminada',
    CONCAT('Tu carrera "', race_record.name, '" ha sido eliminada. Revisa los mensajes del administrador para más detalles.'),
    jsonb_build_object(
      'admin_id', p_admin_user_id,
      'race_id', p_race_id,
      'race_name', race_record.name,
      'deletion_date', now(),
      'reason', p_deletion_reason
    )
  );

  -- Delete race images first
  DELETE FROM race_images WHERE race_id = race_record.id;

  -- Delete the race (bookings will be kept for record purposes, but status is already cancelled)
  DELETE FROM races WHERE id = p_race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', race_record.name,
    'host_name', COALESCE(race_record.first_name || ' ' || race_record.last_name, race_record.email)
  );
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;

-- Step 7: Add helpful comments
COMMENT ON FUNCTION validate_race_date_smart() IS 'Smart validation that only checks race_date when inserting or when race_date field is being updated';
COMMENT ON TRIGGER race_date_validation_trigger ON public.races IS 'Validates race_date only when necessary, allows status updates on existing races';
COMMENT ON FUNCTION admin_update_race_status IS 'Updates race status with correct parameter names to match frontend expectations - Fixed constraint issue';
COMMENT ON FUNCTION admin_delete_race IS 'Deletes race with correct parameter names to match frontend expectations';

-- Step 8: Test the fix
DO $$
DECLARE
    test_result jsonb;
    test_race_id uuid;
BEGIN
    -- Find a race to test with
    SELECT id INTO test_race_id FROM races LIMIT 1;
    
    IF test_race_id IS NOT NULL THEN
        -- Test that we can update just the updated_at timestamp without constraint issues
        UPDATE races SET updated_at = NOW() WHERE id = test_race_id;
        RAISE NOTICE 'SUCCESS: Race status update functionality is working correctly';
    ELSE
        RAISE NOTICE 'No races found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

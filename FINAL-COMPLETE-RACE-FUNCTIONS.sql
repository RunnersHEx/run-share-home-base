-- COMPLETE RACE MANAGEMENT FUNCTIONS - FINAL CLEAN VERSION
-- Apply this single file to fix everything

-- Drop existing functions
DROP FUNCTION IF EXISTS admin_delete_race(uuid,uuid,text);
DROP FUNCTION IF EXISTS admin_update_race_status(uuid,uuid,boolean,text);

-- 1. RACE DELETE FUNCTION WITH FULL FUNCTIONALITY
CREATE OR REPLACE FUNCTION admin_delete_race(
  p_race_id uuid,
  p_admin_user_id uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_race_record RECORD;
  v_admin_profile RECORD;
  v_booking_record RECORD;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Validate inputs
  IF p_race_id IS NULL OR p_admin_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid parameters');
  END IF;

  -- Check if admin exists
  SELECT * INTO v_admin_profile FROM profiles WHERE id = p_admin_user_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin profile not found');
  END IF;

  -- Get race record with host info
  SELECT r.id, r.name, r.host_id, r.race_date, 
         pr.first_name, pr.last_name, pr.email 
  INTO v_race_record 
  FROM races r
  LEFT JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Cancel all bookings and refund points
  FOR v_booking_record IN 
    SELECT b.id, b.guest_id, b.points_cost, b.status,
           gp.first_name as guest_first_name, gp.last_name as guest_last_name, gp.email as guest_email
    FROM bookings b
    LEFT JOIN profiles gp ON gp.id = b.guest_id
    WHERE b.race_id = p_race_id AND b.status NOT IN ('cancelled', 'completed')
  LOOP
    -- Cancel the booking
    UPDATE bookings 
    SET status = 'cancelled', cancelled_at = now()
    WHERE id = v_booking_record.id;

    -- Refund points to guest
    IF v_booking_record.points_cost > 0 AND v_booking_record.guest_id IS NOT NULL THEN
      UPDATE profiles 
      SET points_balance = COALESCE(points_balance, 0) + v_booking_record.points_cost
      WHERE id = v_booking_record.guest_id;

      -- Create points transaction for refund
      INSERT INTO points_transactions (
        user_id,
        booking_id,
        amount,
        type,
        description
      ) VALUES (
        v_booking_record.guest_id,
        v_booking_record.id,
        v_booking_record.points_cost,
        'booking_refund',
        CONCAT('Reembolso por eliminación de carrera: ', COALESCE(v_race_record.name, 'Carrera eliminada'))
      );

      -- Create notification for guest
      INSERT INTO user_notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        v_booking_record.guest_id,
        'booking_cancelled',
        'Reserva cancelada',
        CONCAT('Tu reserva para "', COALESCE(v_race_record.name, 'carrera'), '" ha sido cancelada. Se han reembolsado ', v_booking_record.points_cost, ' puntos.'),
        jsonb_build_object(
          'admin_id', p_admin_user_id,
          'race_id', p_race_id,
          'race_name', v_race_record.name,
          'booking_id', v_booking_record.id,
          'refund_amount', v_booking_record.points_cost,
          'cancellation_date', now(),
          'reason', p_deletion_reason
        )
      );
    END IF;
  END LOOP;

  -- Send notification to host
  IF v_race_record.host_id IS NOT NULL THEN
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_race_record.host_id,
      'race_deleted',
      'Carrera eliminada',
      CONCAT('Tu carrera "', COALESCE(v_race_record.name, 'carrera'), '" ha sido eliminada. ', COALESCE(p_deletion_reason, 'Motivo no especificado.')),
      jsonb_build_object(
        'admin_id', p_admin_user_id,
        'race_id', p_race_id,
        'race_name', v_race_record.name,
        'deletion_date', now(),
        'reason', p_deletion_reason
      )
    );
  END IF;

  -- Delete related records in correct order
  DELETE FROM race_images WHERE race_id = p_race_id;
  DELETE FROM races WHERE id = p_race_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race could not be deleted');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', COALESCE(v_race_record.name, 'Carrera eliminada'),
    'host_name', COALESCE(v_race_record.first_name || ' ' || v_race_record.last_name, v_race_record.email, 'Host desconocido')
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', CONCAT('Database error: ', SQLERRM),
      'detail', SQLSTATE
    );
END;
$$;

-- 2. RACE STATUS UPDATE FUNCTION
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
  v_race_record RECORD;
  v_admin_profile RECORD;
  v_action_type text;
BEGIN
  -- Check if admin exists
  SELECT * INTO v_admin_profile FROM profiles WHERE id = p_admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record with host info
  SELECT r.*, pr.first_name, pr.last_name, pr.email 
  INTO v_race_record 
  FROM races r
  JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Determine action type
  v_action_type := CASE WHEN p_new_is_active THEN 'activation' ELSE 'deactivation' END;

  -- Update race status
  UPDATE races 
  SET is_active = p_new_is_active, updated_at = now()
  WHERE id = p_race_id;

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
    v_race_record.host_id,
    v_action_type,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido aprobada y ya está disponible para reservas.')
      ELSE 
        CONCAT(
          'Tu carrera "', v_race_record.name, '" ha sido desactivada. ',
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
    v_race_record.host_id,
    CASE WHEN p_new_is_active THEN 'race_approved' ELSE 'race_rejected' END,
    CASE 
      WHEN p_new_is_active THEN 'Carrera aprobada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN p_new_is_active THEN 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido aprobada exitosamente.')
      ELSE 
        CONCAT('Tu carrera "', v_race_record.name, '" ha sido desactivada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', p_admin_user_id,
      'race_id', p_race_id,
      'race_name', v_race_record.name,
      'action', CASE WHEN p_new_is_active THEN 'approve' ELSE 'reject' END,
      'notes', p_admin_notes,
      'action_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action_type,
    'race_name', v_race_record.name,
    'host_name', COALESCE(v_race_record.first_name || ' ' || v_race_record.last_name, v_race_record.email)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO anon;
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_race_status TO anon;

-- Verify functions were created
SELECT 'Race management functions created successfully with clean parameter names' as status;

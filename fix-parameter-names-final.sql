-- FINAL FIX - Function with original parameter names but internal variables to avoid ambiguity
DROP FUNCTION IF EXISTS admin_delete_race(uuid,uuid,text);

CREATE OR REPLACE FUNCTION admin_delete_race(
  race_id uuid,
  admin_user_id uuid,
  deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Use local variables with different names to avoid column ambiguity
  target_race_id uuid := race_id;
  target_admin_id uuid := admin_user_id;
  target_reason text := deletion_reason;
  v_race_record RECORD;
  v_admin_profile RECORD;
  v_booking_record RECORD;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Validate inputs
  IF target_race_id IS NULL OR target_admin_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid parameters');
  END IF;

  -- Check if admin exists in profiles table
  SELECT * INTO v_admin_profile FROM profiles WHERE id = target_admin_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin profile not found');
  END IF;

  -- Get race record with host info
  SELECT r.id, r.name, r.host_id, r.race_date, 
         pr.first_name, pr.last_name, pr.email 
  INTO v_race_record 
  FROM races r
  LEFT JOIN profiles pr ON pr.id = r.host_id
  WHERE r.id = target_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Handle bookings - cancel and refund points
  FOR v_booking_record IN 
    SELECT b.id, b.guest_id, b.points_cost, b.status,
           gp.first_name as guest_first_name, gp.last_name as guest_last_name, gp.email as guest_email
    FROM bookings b
    LEFT JOIN profiles gp ON gp.id = b.guest_id
    WHERE b.race_id = target_race_id AND b.status NOT IN ('cancelled', 'completed')
  LOOP
    -- Cancel the booking
    UPDATE bookings 
    SET status = 'cancelled', cancelled_at = now()
    WHERE id = v_booking_record.id;

    -- Refund points to guest if points were spent
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

      -- Create notification for guest if they exist
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
          'admin_id', target_admin_id,
          'race_id', target_race_id,
          'race_name', v_race_record.name,
          'booking_id', v_booking_record.id,
          'refund_amount', v_booking_record.points_cost,
          'cancellation_date', now(),
          'reason', target_reason
        )
      );
    END IF;
  END LOOP;

  -- Send notification to host before deletion
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
      CONCAT('Tu carrera "', COALESCE(v_race_record.name, 'carrera'), '" ha sido eliminada. ', COALESCE(target_reason, 'Motivo no especificado.')),
      jsonb_build_object(
        'admin_id', target_admin_id,
        'race_id', target_race_id,
        'race_name', v_race_record.name,
        'deletion_date', now(),
        'reason', target_reason
      )
    );
  END IF;

  -- Delete related records in the correct order to avoid constraint violations
  
  -- Delete race images
  DELETE FROM race_images WHERE race_id = target_race_id;
  
  -- Finally delete the race
  DELETE FROM races WHERE id = target_race_id;
  
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

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO anon;

-- Verify function was created
SELECT 'admin_delete_race function recreated with original parameter names' as status;

-- FINAL SQL FUNCTION - Clean parameter names, no ambiguity
DROP FUNCTION IF EXISTS admin_delete_race(uuid,uuid,text);

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

GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO anon;

SELECT 'admin_delete_race function created with clean parameter names' as status;

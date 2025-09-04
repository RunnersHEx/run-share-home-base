-- =============================================
-- RACE MANAGEMENT FUNCTIONS
-- Adds admin functions for race approval/rejection and deletion
-- =============================================

-- Function to handle race approval/rejection with notifications
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

  -- Update race status
  UPDATE races 
  SET is_active = new_is_active, updated_at = now()
  WHERE id = race_id;

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
END;
$$;

-- Function to handle race deletion with notifications
CREATE OR REPLACE FUNCTION admin_delete_race(
  race_id uuid,
  admin_user_id uuid,
  deletion_reason text DEFAULT NULL
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

  -- Cancel all bookings for this race and refund points
  FOR bookings_to_cancel IN 
    SELECT b.*, guest_profile.first_name as guest_first_name, guest_profile.last_name as guest_last_name, guest_profile.email as guest_email
    FROM bookings b
    JOIN profiles guest_profile ON guest_profile.id = b.guest_id
    WHERE b.race_id = race_id AND b.status NOT IN ('cancelled', 'completed')
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
      admin_user_id,
      bookings_to_cancel.guest_id,
      'general',
      'Reserva cancelada - Carrera eliminada',
      CONCAT(
        'Tu reserva para la carrera "', race_record.name, '" ha sido cancelada porque la carrera fue eliminada. ',
        'Se han reembolsado ', bookings_to_cancel.points_cost, ' puntos a tu cuenta. ',
        COALESCE(deletion_reason, 'Carrera eliminada por el administrador.')
      ),
      deletion_reason
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
        'admin_id', admin_user_id,
        'race_id', race_id,
        'race_name', race_record.name,
        'booking_id', bookings_to_cancel.id,
        'refund_amount', bookings_to_cancel.points_cost,
        'cancellation_date', now(),
        'reason', deletion_reason
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
    admin_user_id,
    race_record.host_id,
    'general',
    'Carrera eliminada',
    CONCAT('Tu carrera "', race_record.name, '" ha sido eliminada permanentemente. ', 
           COALESCE(deletion_reason, 'Carrera eliminada por el administrador.')),
    deletion_reason
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
      'admin_id', admin_user_id,
      'race_id', race_id,
      'race_name', race_record.name,
      'deletion_date', now(),
      'reason', deletion_reason
    )
  );

  -- Delete race images first
  DELETE FROM race_images WHERE race_id = race_record.id;

  -- Delete the race (bookings will be kept for record purposes, but status is already cancelled)
  DELETE FROM races WHERE id = race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', race_record.name,
    'host_name', COALESCE(race_record.first_name || ' ' || race_record.last_name, race_record.email)
  );
END;
$$;

-- Add RLS policies for race management
CREATE POLICY "Admins can view all races" 
  ON public.races 
  FOR SELECT 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update all races" 
  ON public.races 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete all races" 
  ON public.races 
  FOR DELETE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_update_race_status IS 'Updates race status and sends admin messages/notifications to host';
COMMENT ON FUNCTION admin_delete_race IS 'Deletes race, cancels bookings, refunds points and sends notifications';

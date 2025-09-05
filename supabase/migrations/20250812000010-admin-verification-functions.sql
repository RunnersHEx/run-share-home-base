-- =============================================
-- ADMIN VERIFICATION FUNCTIONS MIGRATION
-- Adds functions for handling admin verification workflow
-- =============================================

-- Function to handle verification status update with admin messages
CREATE OR REPLACE FUNCTION admin_update_verification_status(
  verification_request_id uuid,
  admin_user_id uuid,
  new_status text,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_request RECORD;
  user_profile RECORD;
  admin_profile RECORD;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get verification request
  SELECT * INTO verification_request FROM verification_requests WHERE id = verification_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification request not found');
  END IF;

  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = verification_request.user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Update verification request
  UPDATE verification_requests 
  SET 
    status = new_status,
    reviewed_at = now(),
    reviewed_by = admin_user_id,
    admin_notes = admin_notes
  WHERE id = verification_request_id;

  -- Update user profile verification status
  UPDATE profiles 
  SET verification_status = new_status
  WHERE id = verification_request.user_id;

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
    verification_request.user_id,
    CASE WHEN new_status = 'approved' THEN 'activation' ELSE 'warning' END,
    CASE 
      WHEN new_status = 'approved' THEN 'Cuenta verificada' 
      ELSE 'Verificación rechazada' 
    END,
    CASE 
      WHEN new_status = 'approved' THEN 
        'Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de la plataforma.'
      ELSE 
        CONCAT(
          'Tu solicitud de verificación ha sido rechazada. ',
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
    verification_request.user_id,
    CASE WHEN new_status = 'approved' THEN 'account_verified' ELSE 'verification_rejected' END,
    CASE 
      WHEN new_status = 'approved' THEN 'Cuenta verificada' 
      ELSE 'Verificación rechazada' 
    END,
    CASE 
      WHEN new_status = 'approved' THEN 
        'Tu cuenta ha sido verificada exitosamente.'
      ELSE 
        'Tu solicitud de verificación ha sido rechazada. Revisa los mensajes del administrador para más detalles.'
    END,
    jsonb_build_object(
      'admin_id', admin_user_id,
      'verification_request_id', verification_request_id,
      'status', new_status,
      'notes', admin_notes,
      'verification_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', new_status,
    'user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email)
  );
END;
$$;

-- Function to handle race status updates with notifications
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
  host_profile RECORD;
  admin_profile RECORD;
  action_type text;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record
  SELECT r.*, p.first_name, p.last_name, p.email 
  INTO race_record 
  FROM races r
  JOIN profiles p ON p.id = r.host_id
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
      WHEN new_is_active THEN 'Carrera activada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido activada y ya está disponible para reservas.')
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
    CASE WHEN new_is_active THEN 'race_activated' ELSE 'race_deactivated' END,
    CASE 
      WHEN new_is_active THEN 'Carrera activada' 
      ELSE 'Carrera desactivada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu carrera "', race_record.name, '" ha sido activada exitosamente.')
      ELSE 
        CONCAT('Tu carrera "', race_record.name, '" ha sido desactivada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', admin_user_id,
      'race_id', race_id,
      'race_name', race_record.name,
      'action', CASE WHEN new_is_active THEN 'activate' ELSE 'deactivate' END,
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
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get race record
  SELECT r.*, p.first_name, p.last_name, p.email 
  INTO race_record 
  FROM races r
  JOIN profiles p ON p.id = r.host_id
  WHERE r.id = race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Race not found');
  END IF;

  -- Create admin message before deletion
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
           COALESCE(deletion_reason, 'Carrera eliminada por el administrador')),
    deletion_reason
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

  -- Delete the race
  DELETE FROM races WHERE id = race_id;

  RETURN jsonb_build_object(
    'success', true,
    'race_name', race_record.name,
    'host_name', COALESCE(race_record.first_name || ' ' || race_record.last_name, race_record.email)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_update_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_race_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_race TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_update_verification_status IS 'Updates verification request status and sends admin messages/notifications';
COMMENT ON FUNCTION admin_update_race_status IS 'Updates race active status and sends admin messages/notifications'; 
COMMENT ON FUNCTION admin_delete_race IS 'Deletes race and sends admin messages/notifications to host';

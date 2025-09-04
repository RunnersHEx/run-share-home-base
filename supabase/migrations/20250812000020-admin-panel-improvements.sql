-- =============================================
-- ADMIN PANEL IMPROVEMENTS MIGRATION
-- Fixes verification issues and adds property management
-- =============================================

-- Function to process user verification without direct table access
CREATE OR REPLACE FUNCTION admin_process_user_verification(
  user_id uuid,
  admin_user_id uuid,
  new_status text,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  admin_profile RECORD;
  verification_request_id uuid;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Check if user has verification documents
  IF user_profile.verification_documents IS NULL OR 
     array_length(user_profile.verification_documents, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'User has no verification documents');
  END IF;

  -- Try to get existing verification request
  SELECT id INTO verification_request_id 
  FROM verification_requests 
  WHERE user_id = user_profile.id 
  ORDER BY submitted_at DESC 
  LIMIT 1;

  -- If no verification request exists, create one
  IF verification_request_id IS NULL THEN
    INSERT INTO verification_requests (
      user_id,
      status,
      submitted_at
    ) VALUES (
      user_profile.id,
      'pending',
      now()
    ) RETURNING id INTO verification_request_id;
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
  WHERE id = user_profile.id;

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
    user_profile.id,
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
    user_profile.id,
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

-- Function to handle property deletion with notifications
CREATE OR REPLACE FUNCTION admin_delete_property(
  property_id uuid,
  admin_user_id uuid,
  deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  property_record RECORD;
  admin_profile RECORD;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get property record with owner info
  SELECT p.*, pr.first_name, pr.last_name, pr.email 
  INTO property_record 
  FROM properties p
  JOIN profiles pr ON pr.id = p.owner_id
  WHERE p.id = property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property not found');
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
    property_record.owner_id,
    'general',
    'Propiedad eliminada',
    CONCAT('Tu propiedad "', property_record.title, '" ha sido eliminada permanentemente. ', 
           COALESCE(deletion_reason, 'Propiedad eliminada por el administrador')),
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
    property_record.owner_id,
    'property_deleted',
    'Propiedad eliminada',
    CONCAT('Tu propiedad "', property_record.title, '" ha sido eliminada. Revisa los mensajes del administrador para más detalles.'),
    jsonb_build_object(
      'admin_id', admin_user_id,
      'property_id', property_id,
      'property_title', property_record.title,
      'deletion_date', now(),
      'reason', deletion_reason
    )
  );

  -- Delete property images first
  DELETE FROM property_images WHERE property_id = property_record.id;

  -- Delete property availability records
  DELETE FROM property_availability WHERE property_id = property_record.id;

  -- Delete the property
  DELETE FROM properties WHERE id = property_id;

  RETURN jsonb_build_object(
    'success', true,
    'property_title', property_record.title,
    'owner_name', COALESCE(property_record.first_name || ' ' || property_record.last_name, property_record.email)
  );
END;
$$;

-- Function to handle property approval/rejection with notifications
CREATE OR REPLACE FUNCTION admin_update_property_status(
  property_id uuid,
  admin_user_id uuid,
  new_is_active boolean,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  property_record RECORD;
  admin_profile RECORD;
  action_type text;
  result jsonb;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get property record with owner info
  SELECT p.*, pr.first_name, pr.last_name, pr.email 
  INTO property_record 
  FROM properties p
  JOIN profiles pr ON pr.id = p.owner_id
  WHERE p.id = property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property not found');
  END IF;

  -- Determine action type
  action_type := CASE WHEN new_is_active THEN 'activation' ELSE 'deactivation' END;

  -- Update property status
  UPDATE properties 
  SET is_active = new_is_active, updated_at = now()
  WHERE id = property_id;

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
    property_record.owner_id,
    action_type,
    CASE 
      WHEN new_is_active THEN 'Propiedad aprobada' 
      ELSE 'Propiedad rechazada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu propiedad "', property_record.title, '" ha sido aprobada y ya está disponible para reservas.')
      ELSE 
        CONCAT(
          'Tu propiedad "', property_record.title, '" ha sido rechazada. ',
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
    property_record.owner_id,
    CASE WHEN new_is_active THEN 'property_approved' ELSE 'property_rejected' END,
    CASE 
      WHEN new_is_active THEN 'Propiedad aprobada' 
      ELSE 'Propiedad rechazada' 
    END,
    CASE 
      WHEN new_is_active THEN 
        CONCAT('Tu propiedad "', property_record.title, '" ha sido aprobada exitosamente.')
      ELSE 
        CONCAT('Tu propiedad "', property_record.title, '" ha sido rechazada. Revisa los mensajes del administrador para más detalles.')
    END,
    jsonb_build_object(
      'admin_id', admin_user_id,
      'property_id', property_id,
      'property_title', property_record.title,
      'action', CASE WHEN new_is_active THEN 'approve' ELSE 'reject' END,
      'notes', admin_notes,
      'action_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', action_type,
    'property_title', property_record.title,
    'owner_name', COALESCE(property_record.first_name || ' ' || property_record.last_name, property_record.email)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_process_user_verification TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_property TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_property_status TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_process_user_verification IS 'Processes user verification without requiring direct table access';
COMMENT ON FUNCTION admin_delete_property IS 'Deletes property and sends admin messages/notifications to owner';
COMMENT ON FUNCTION admin_update_property_status IS 'Updates property status and sends admin messages/notifications';

-- Simple version that works in Supabase dashboard
CREATE OR REPLACE FUNCTION admin_process_user_verification(
  user_id uuid,
  admin_user_id uuid,
  new_status text,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_profile RECORD;
  admin_profile RECORD;
  verification_request_id uuid;
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
    INSERT INTO verification_requests (user_id, status, submitted_at) 
    VALUES (user_profile.id, 'pending', now()) 
    RETURNING id INTO verification_request_id;
  END IF;

  -- Update verification request
  UPDATE verification_requests 
  SET status = new_status, reviewed_at = now(), reviewed_by = admin_user_id, admin_notes = admin_notes
  WHERE id = verification_request_id;

  -- Update user profile verification status
  UPDATE profiles 
  SET verification_status = new_status
  WHERE id = user_profile.id;

  -- Create admin message
  INSERT INTO admin_messages (admin_id, user_id, message_type, title, message, reason) 
  VALUES (
    admin_user_id,
    user_profile.id,
    CASE WHEN new_status = 'approved' THEN 'activation' ELSE 'warning' END,
    CASE WHEN new_status = 'approved' THEN 'Cuenta verificada' ELSE 'Verificación rechazada' END,
    CASE WHEN new_status = 'approved' THEN 'Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de la plataforma.'
         ELSE CONCAT('Tu solicitud de verificación ha sido rechazada. ', CASE WHEN admin_notes IS NOT NULL THEN CONCAT('Motivo: ', admin_notes, ' ') ELSE '' END, 'Contacta con soporte si necesitas más información.') END,
    admin_notes
  );

  -- Create notification
  INSERT INTO user_notifications (user_id, type, title, message, data) 
  VALUES (
    user_profile.id,
    CASE WHEN new_status = 'approved' THEN 'account_verified' ELSE 'verification_rejected' END,
    CASE WHEN new_status = 'approved' THEN 'Cuenta verificada' ELSE 'Verificación rechazada' END,
    CASE WHEN new_status = 'approved' THEN 'Tu cuenta ha sido verificada exitosamente.'
         ELSE 'Tu solicitud de verificación ha sido rechazada. Revisa los mensajes del administrador para más detalles.' END,
    jsonb_build_object('admin_id', admin_user_id, 'verification_request_id', verification_request_id, 'status', new_status, 'notes', admin_notes, 'verification_date', now())
  );

  RETURN jsonb_build_object('success', true, 'status', new_status, 'user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email));
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_process_user_verification TO authenticated;

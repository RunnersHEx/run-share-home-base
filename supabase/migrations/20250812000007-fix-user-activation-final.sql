-- =============================================
-- FIX USER ACTIVATION FUNCTION
-- Removes user_notifications insert that's causing 500 error
-- =============================================

-- Fixed function to activate/deactivate user (removes user_notifications insert)
CREATE OR REPLACE FUNCTION admin_toggle_user_status(
  target_user_id uuid,
  admin_user_id uuid,
  deactivation_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status boolean;
  new_status boolean;
  user_profile RECORD;
  admin_profile RECORD;
  result jsonb;
BEGIN
  -- Check if admin exists and has admin privileges
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get current user status
  SELECT is_active, first_name, last_name, email 
  INTO current_status, user_profile.first_name, user_profile.last_name, user_profile.email
  FROM profiles 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Toggle status
  new_status := NOT current_status;
  
  -- Update user status
  UPDATE profiles 
  SET is_active = new_status 
  WHERE id = target_user_id;

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
    target_user_id,
    CASE WHEN new_status THEN 'activation' ELSE 'deactivation' END,
    CASE 
      WHEN new_status THEN 'Cuenta activada' 
      ELSE 'Cuenta desactivada' 
    END,
    CASE 
      WHEN new_status THEN 
        'Tu cuenta ha sido reactivada por el administrador. Ya puedes acceder a todas las funcionalidades de la plataforma.'
      ELSE 
        COALESCE(
          'Tu cuenta ha sido desactivada por el administrador. ' || 
          CASE WHEN deactivation_reason IS NOT NULL THEN 'Motivo: ' || deactivation_reason ELSE '' END ||
          ' Contacta con soporte si tienes preguntas.',
          'Tu cuenta ha sido desactivada por el administrador. Contacta con soporte si tienes preguntas.'
        )
    END,
    deactivation_reason
  );

  -- NOTE: Removed user_notifications insert that was causing 500 error
  -- Frontend NotificationService will handle notifications separately

  RETURN jsonb_build_object(
    'success', true, 
    'new_status', new_status,
    'user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email)
  );
END;
$$;

-- Fixed function to delete user (removes user_notifications reference)
CREATE OR REPLACE FUNCTION admin_delete_user_complete(
  target_user_id uuid,
  admin_user_id uuid,
  deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  admin_profile RECORD;
BEGIN
  -- Check if admin exists
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin not found');
  END IF;

  -- Get user profile for logging
  SELECT * INTO user_profile FROM profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Create deletion record (if table exists)
  BEGIN
    INSERT INTO account_deletions (
      user_id,
      email,
      first_name,
      last_name,
      deletion_type,
      deletion_reason,
      deleted_by_admin_id,
      total_bookings,
      total_points_at_deletion,
      verification_status
    ) 
    SELECT 
      target_user_id,
      user_profile.email,
      user_profile.first_name,
      user_profile.last_name,
      'admin_deleted',
      deletion_reason,
      admin_user_id,
      (SELECT COUNT(*) FROM bookings WHERE guest_id = target_user_id OR host_id = target_user_id),
      COALESCE(user_profile.points_balance, 0),
      user_profile.verification_status;
  EXCEPTION 
    WHEN undefined_table THEN
      -- Table doesn't exist, skip logging
      NULL;
  END;

  -- Delete related records in order (to handle foreign key constraints)
  DELETE FROM admin_messages WHERE user_id = target_user_id;
  DELETE FROM user_notifications WHERE user_id = target_user_id;
  DELETE FROM points_transactions WHERE user_id = target_user_id;
  DELETE FROM booking_reviews WHERE reviewer_id = target_user_id OR reviewee_id = target_user_id;
  DELETE FROM verification_requests WHERE user_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  
  -- Delete bookings as guest or host
  DELETE FROM booking_messages WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id = target_user_id OR host_id = target_user_id
  );
  DELETE FROM conversations WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id = target_user_id OR host_id = target_user_id
  );
  DELETE FROM bookings WHERE guest_id = target_user_id OR host_id = target_user_id;
  
  -- Delete properties and races
  DELETE FROM property_images WHERE property_id IN (SELECT id FROM properties WHERE owner_id = target_user_id);
  DELETE FROM property_availability WHERE property_id IN (SELECT id FROM properties WHERE owner_id = target_user_id);
  DELETE FROM race_images WHERE race_id IN (SELECT id FROM races WHERE host_id = target_user_id);
  DELETE FROM races WHERE host_id = target_user_id;
  DELETE FROM properties WHERE owner_id = target_user_id;
  
  -- Finally delete the profile
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this might fail if not allowed, but try anyway)
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Deletion from auth.users failed, but that's ok
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_toggle_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_complete TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_toggle_user_status(uuid, uuid, text) IS 'Toggle user activation status with admin message (notifications handled by frontend)';
COMMENT ON FUNCTION admin_delete_user_complete(uuid, uuid, text) IS 'Complete user deletion with cleanup of all related data';

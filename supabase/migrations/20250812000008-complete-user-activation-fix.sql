-- =============================================
-- COMPLETE USER ACTIVATION FIX
-- Part 1: Fix RLS policies for user_notifications
-- Part 2: Restore full admin function
-- =============================================

-- FIX USER_NOTIFICATIONS RLS POLICIES
-- Allow proper access to user_notifications table
-- =============================================

-- Enable RLS (if not already enabled)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON user_notifications;

-- Allow users to read their own notifications
CREATE POLICY "Users can read their own notifications" 
ON user_notifications 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow system/service to insert notifications for any user
CREATE POLICY "System can create notifications" 
ON user_notifications 
FOR INSERT 
WITH CHECK (true);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON user_notifications 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Grant proper table permissions
GRANT SELECT ON user_notifications TO authenticated;
GRANT INSERT ON user_notifications TO authenticated;
GRANT UPDATE ON user_notifications TO authenticated;

-- =============================================
-- RESTORE FULL ADMIN TOGGLE USER STATUS FUNCTION  
-- Now that we know the function can be called
-- =============================================

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
BEGIN
  -- Check if admin exists
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

  -- Return success
  RETURN jsonb_build_object(
    'success', true, 
    'new_status', new_status,
    'user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email)
  );
END;
$$;

-- =============================================
-- COMPLETE FIX: RLS ISSUE FOR ADMIN TOGGLE FUNCTION
-- Bypass RLS for admin functions
-- =============================================

-- Create admin toggle function that bypasses RLS
CREATE OR REPLACE FUNCTION admin_toggle_user_status(
  target_user_id uuid,
  admin_user_id uuid,
  deactivation_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off  -- Bypass RLS for this admin function
AS $$
DECLARE
  current_status boolean;
  new_status boolean;
  user_first_name text;
  user_last_name text;
  user_email text;
BEGIN
  -- Get user data (RLS bypassed)
  SELECT 
    is_active, 
    first_name, 
    last_name, 
    email 
  INTO 
    current_status,
    user_first_name,
    user_last_name,
    user_email
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

  -- Create admin message using auth.uid() for admin_id
  INSERT INTO admin_messages (
    admin_id,
    user_id, 
    message_type,
    title,
    message,
    reason
  ) VALUES (
    auth.uid(),  -- Use current authenticated user ID
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

  RETURN jsonb_build_object(
    'success', true, 
    'new_status', new_status,
    'user_name', COALESCE(user_first_name || ' ' || user_last_name, user_email)
  );
END;
$$;
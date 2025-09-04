-- =============================================
-- USER ACTIVATION SYSTEM MIGRATION
-- Adds is_active column and admin messaging
-- =============================================

-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- =============================================
-- ADMIN MESSAGING SYSTEM
-- =============================================

-- Create admin_messages table for admin-user communication
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['deactivation'::text, 'activation'::text, 'warning'::text, 'general'::text])),
  title text NOT NULL,
  message text NOT NULL CHECK (length(message) <= 2000),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT admin_messages_pkey PRIMARY KEY (id),
  CONSTRAINT admin_messages_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id),
  CONSTRAINT admin_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_messages_user_id ON public.admin_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_admin_id ON public.admin_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON public.admin_messages(created_at DESC);

-- =============================================
-- ADMIN FUNCTIONS
-- =============================================

-- Function to activate/deactivate user
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
  -- Check if admin exists and has admin privileges (you might want to add admin role check here)
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

  -- Create notification
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    target_user_id,
    CASE WHEN new_status THEN 'account_activated' ELSE 'account_deactivated' END,
    CASE 
      WHEN new_status THEN 'Cuenta activada' 
      ELSE 'Cuenta desactivada' 
    END,
    CASE 
      WHEN new_status THEN 
        'Tu cuenta ha sido reactivada. Ya puedes acceder a todas las funcionalidades.'
      ELSE 
        'Tu cuenta ha sido desactivada. Revisa los mensajes del administrador para más información.'
    END,
    jsonb_build_object(
      'admin_id', admin_user_id,
      'new_status', new_status,
      'reason', deactivation_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'new_status', new_status,
    'user_name', COALESCE(user_profile.first_name || ' ' || user_profile.last_name, user_profile.email)
  );
END;
$$;

-- Function to delete user (admin only)
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
      deleted_by,
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

-- Function to get admin messages for a user
CREATE OR REPLACE FUNCTION get_admin_messages_for_user(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  admin_name text,
  message_type text,
  title text,
  message text,
  reason text,
  created_at timestamp with time zone,
  read_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Administrador') as admin_name,
    am.message_type,
    am.title,
    am.message,
    am.reason,
    am.created_at,
    am.read_at
  FROM admin_messages am
  LEFT JOIN profiles p ON p.id = am.admin_id
  WHERE am.user_id = target_user_id
  ORDER BY am.created_at DESC;
END;
$$;

-- Function to mark admin message as read
CREATE OR REPLACE FUNCTION mark_admin_message_read(message_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_messages 
  SET read_at = now() 
  WHERE id = message_id AND user_id = target_user_id AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- GUARANTEE NEW USERS ARE ACTIVE
-- =============================================

-- Create trigger function to ensure new users are always active
CREATE OR REPLACE FUNCTION ensure_user_active_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Force is_active to true for all new user profiles
  NEW.is_active := true;
  
  -- Log the user creation for debugging
  RAISE NOTICE 'New user profile created with is_active = true for user: %', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires BEFORE INSERT on profiles
DROP TRIGGER IF EXISTS trigger_ensure_user_active ON profiles;
CREATE TRIGGER trigger_ensure_user_active
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_active_on_insert();

-- Also create a safety trigger for UPDATEs to prevent accidental deactivation during registration
CREATE OR REPLACE FUNCTION prevent_accidental_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is a new profile (created in last 5 minutes) and someone tries to deactivate it
  -- during registration process, keep it active
  IF OLD.is_active = true 
     AND NEW.is_active = false 
     AND NEW.created_at > (now() - interval '5 minutes') THEN
    
    -- Log this attempt
    RAISE NOTICE 'Prevented deactivation of newly created user profile: %', NEW.id;
    
    -- Keep user active
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for preventing accidental deactivation during registration
DROP TRIGGER IF EXISTS trigger_prevent_registration_deactivation ON profiles;
CREATE TRIGGER trigger_prevent_registration_deactivation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_accidental_deactivation();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on admin_messages
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own admin messages
CREATE POLICY "Users can read their own admin messages" 
ON admin_messages 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow admins to create admin messages (you might want to add admin role check)
CREATE POLICY "Admins can create admin messages" 
ON admin_messages 
FOR INSERT 
WITH CHECK (true); -- Add proper admin check here

-- Allow users to update read_at on their messages
CREATE POLICY "Users can mark their admin messages as read" 
ON admin_messages 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- =============================================
-- UPDATE EXISTING DATA
-- =============================================

-- Set all existing users as active (default)
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Add comments to document the system
COMMENT ON TABLE admin_messages IS 'Admin messages sent to users for account management';
COMMENT ON COLUMN profiles.is_active IS 'Whether user account is active and can access platform features';
COMMENT ON FUNCTION ensure_user_active_on_insert() IS 'Ensures all new user profiles start with is_active = true';
COMMENT ON FUNCTION prevent_accidental_deactivation() IS 'Prevents accidental deactivation of users during registration process';

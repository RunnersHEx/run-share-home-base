-- SAFE VERSION: Function to notify admins when a new user registers
-- This version includes comprehensive error handling to ensure it never breaks user registration
CREATE OR REPLACE FUNCTION notify_admins_new_user_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Wrap everything in a BEGIN/EXCEPTION block to ensure this never breaks user registration
  BEGIN
    -- Get user details with safe defaults
    user_name := COALESCE(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), 'Usuario sin nombre');
    user_email := COALESCE(NEW.email, 'Email no especificado');
    
    -- Get admin users (based on the admin emails used in the application)
    FOR admin_record IN 
      SELECT id FROM public.profiles 
      WHERE email IN ('runnershomeexchange@gmail.com', 'admin@mail.com')
      AND id IS NOT NULL
    LOOP
      -- Try to insert notification for each admin
      BEGIN
        INSERT INTO public.user_notifications (
          user_id,
          type,
          title,
          message,
          data,
          read,
          created_at
        ) VALUES (
          admin_record.id,
          'new_user_registered',
          'Nuevo usuario registrado',
          user_name || ' (' || user_email || ') ha sido registrado',
          jsonb_build_object(
            'new_user_id', NEW.id,
            'new_user_email', user_email,
            'new_user_name', user_name,
            'registration_date', NOW(),
            'verification_status', COALESCE(NEW.verification_status, 'unverified')
          ),
          false,
          NOW()
        );
      EXCEPTION 
        WHEN OTHERS THEN
          -- Log error but don't fail the user registration
          RAISE WARNING 'Failed to create admin notification for new user: %', SQLERRM;
      END;
    END LOOP;
    
  EXCEPTION 
    WHEN OTHERS THEN
      -- If anything fails, log it but don't prevent user registration
      RAISE WARNING 'notify_admins_new_user_safe failed: %', SQLERRM;
  END;
  
  -- Always return NEW to continue the user registration process
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when a new user profile is created (SAFE VERSION)
DROP TRIGGER IF EXISTS trigger_notify_admins_new_user_safe ON public.profiles;
CREATE TRIGGER trigger_notify_admins_new_user_safe
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_user_safe();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_admins_new_user_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admins_new_user_safe() TO anon;

-- SAFE VERSION: Function to notify admins when verification documents are submitted
-- This version includes comprehensive error handling to ensure it never breaks document uploads
CREATE OR REPLACE FUNCTION notify_admins_verification_documents_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  user_name TEXT;
  user_email TEXT;
  document_count INT;
  old_count INT;
  new_count INT;
BEGIN
  -- Wrap everything in a BEGIN/EXCEPTION block to ensure this never breaks document uploads
  BEGIN
    -- Get document counts with safe defaults
    old_count := COALESCE(array_length(OLD.verification_documents, 1), 0);
    new_count := COALESCE(array_length(NEW.verification_documents, 1), 0);
    
    -- Only notify if documents were added (count increased)
    IF new_count <= old_count THEN
      RETURN NEW;
    END IF;
    
    -- Get user details with safe defaults
    user_name := COALESCE(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), 'Usuario sin nombre');
    user_email := COALESCE(NEW.email, 'Email no especificado');
    document_count := new_count;
    
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
          'verification_documents_submitted',
          'Documentos de verificación pendientes',
          user_name || ' (' || user_email || ') ha subido ' || document_count || ' documento(s) de verificación y está pendiente de revisión',
          jsonb_build_object(
            'user_id', NEW.id,
            'user_email', user_email,
            'user_name', user_name,
            'document_count', document_count,
            'submission_date', NOW(),
            'verification_status', COALESCE(NEW.verification_status, 'pending'),
            'verification_documents', COALESCE(NEW.verification_documents, '[]'::jsonb)
          ),
          false,
          NOW()
        );
      EXCEPTION 
        WHEN OTHERS THEN
          -- Log error but don't fail the document upload
          RAISE WARNING 'Failed to create admin notification for verification documents: %', SQLERRM;
      END;
    END LOOP;
    
  EXCEPTION 
    WHEN OTHERS THEN
      -- If anything fails, log it but don't prevent document upload
      RAISE WARNING 'notify_admins_verification_documents_safe failed: %', SQLERRM;
  END;
  
  -- Always return NEW to continue the document upload process
  RETURN NEW;
END;
$$;

-- Create trigger to notify admins when verification documents are updated (SAFE VERSION)
DROP TRIGGER IF EXISTS trigger_notify_admins_verification_documents_safe ON public.profiles;
CREATE TRIGGER trigger_notify_admins_verification_documents_safe
  AFTER UPDATE OF verification_documents ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_verification_documents_safe();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_admins_verification_documents_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admins_verification_documents_safe() TO anon;

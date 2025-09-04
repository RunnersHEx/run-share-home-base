-- Complete SQL to fix verification document notifications
-- Only notify admins when BOTH documents (ID + selfie) are uploaded

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS notify_admins_verification_documents_trigger ON profiles;

-- Create or replace the improved trigger function
CREATE OR REPLACE FUNCTION notify_admins_verification_documents_safe()
RETURNS trigger AS $$
DECLARE
  admin_record RECORD;
  user_name TEXT;
  user_email TEXT;
  document_count INT;
  old_count INT;
  new_count INT;
  has_id_document BOOLEAN;
  has_selfie_document BOOLEAN;
  old_has_both BOOLEAN;
  new_has_both BOOLEAN;
BEGIN
  -- Wrap everything in a BEGIN/EXCEPTION block to ensure this never breaks document uploads
  BEGIN
    -- Get document counts with safe defaults
    old_count := COALESCE(array_length(OLD.verification_documents, 1), 0);
    new_count := COALESCE(array_length(NEW.verification_documents, 1), 0);
    
    -- Only proceed if documents were added (count increased)
    IF new_count <= old_count THEN
      RETURN NEW;
    END IF;
    
    -- Check if OLD state had both required documents
    old_has_both := FALSE;
    IF OLD.verification_documents IS NOT NULL AND array_length(OLD.verification_documents, 1) >= 2 THEN
      old_has_both := (
        EXISTS (SELECT 1 FROM unnest(OLD.verification_documents) AS doc WHERE doc LIKE '%id_document%') AND
        EXISTS (SELECT 1 FROM unnest(OLD.verification_documents) AS doc WHERE doc LIKE '%selfie_with_id%')
      );
    END IF;
    
    -- Check if NEW state has both required documents
    new_has_both := FALSE;
    IF NEW.verification_documents IS NOT NULL AND array_length(NEW.verification_documents, 1) >= 2 THEN
      new_has_both := (
        EXISTS (SELECT 1 FROM unnest(NEW.verification_documents) AS doc WHERE doc LIKE '%id_document%') AND
        EXISTS (SELECT 1 FROM unnest(NEW.verification_documents) AS doc WHERE doc LIKE '%selfie_with_id%')
      );
    END IF;
    
    -- Only send notification if user just completed both documents (new has both, old didn't)
    IF NOT new_has_both OR old_has_both THEN
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
          'Documentos de verificación completos pendientes',
          user_name || ' (' || user_email || ') ha completado la subida de ambos documentos de verificación (ID y selfie) y está pendiente de revisión',
          jsonb_build_object(
            'user_id', NEW.id,
            'user_email', user_email,
            'user_name', user_name,
            'document_count', document_count,
            'submission_date', NOW(),
            'verification_status', COALESCE(NEW.verification_status, 'pending'),
            'verification_documents', COALESCE(NEW.verification_documents, '[]'::jsonb),
            'both_documents_complete', true
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
$$ LANGUAGE plpgsql;

-- Create the new trigger that only fires when verification_documents changes
CREATE TRIGGER notify_admins_verification_documents_trigger
  AFTER UPDATE OF verification_documents ON profiles
  FOR EACH ROW
  WHEN (OLD.verification_documents IS DISTINCT FROM NEW.verification_documents)
  EXECUTE FUNCTION notify_admins_verification_documents_safe();

-- Confirm the changes
SELECT 'Verification notification trigger updated successfully!' AS status;

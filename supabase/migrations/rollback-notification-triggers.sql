-- ROLLBACK SCRIPT: Remove notification triggers and functions
-- Run this if you want to completely remove the admin notification system

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_notify_admins_new_user_safe ON public.profiles;
DROP TRIGGER IF EXISTS trigger_notify_admins_verification_documents_safe ON public.profiles;

-- Drop the old unsafe versions too (in case they were created)
DROP TRIGGER IF EXISTS trigger_notify_admins_new_user ON public.profiles;
DROP TRIGGER IF EXISTS trigger_notify_admins_verification_documents ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS notify_admins_new_user_safe();
DROP FUNCTION IF EXISTS notify_admins_verification_documents_safe();

-- Drop the old unsafe versions too (in case they were created)
DROP FUNCTION IF EXISTS notify_admins_new_user();
DROP FUNCTION IF EXISTS notify_admins_verification_documents();

-- Note: This does NOT remove any notifications that were already created
-- Those will remain in the user_notifications table but won't cause any issues

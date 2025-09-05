-- =============================================
-- FIX ADMIN STORAGE ACCESS FOR VERIFICATION DOCUMENTS
-- Adds policies to allow admin users to access all verification documents
-- =============================================

-- First, let's create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = user_id
  );
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;

-- Add admin access policies for verification-docs bucket
CREATE POLICY "Admins can view all verification docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-docs' 
  AND is_admin_user()
);

CREATE POLICY "Admins can insert verification docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-docs' 
  AND is_admin_user()
);

CREATE POLICY "Admins can update all verification docs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-docs' 
  AND is_admin_user()
);

CREATE POLICY "Admins can delete all verification docs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'verification-docs' 
  AND is_admin_user()
);

-- Add comment to track this change
COMMENT ON FUNCTION is_admin_user IS 'Helper function to check if current user is an admin for storage policies';

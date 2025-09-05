-- =============================================
-- FIX ADMIN STORAGE ACCESS - CORRECT VERSION
-- Fixes ambiguous column reference issue and simplifies admin access
-- =============================================

-- Drop the problematic function and policies first
DROP POLICY IF EXISTS "Admins can view all verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete all verification docs" ON storage.objects;
DROP FUNCTION IF EXISTS is_admin_user(uuid);

-- Create a simpler and more reliable admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user_storage()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if current authenticated user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users a
    WHERE a.user_id = auth.uid()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user_storage() TO authenticated;

-- Create simplified admin storage policies for verification-docs bucket
CREATE POLICY "Admin full access to verification docs" ON storage.objects
FOR ALL USING (
  bucket_id = 'verification-docs' 
  AND public.is_admin_user_storage() = true
);

-- Add comment for tracking
COMMENT ON FUNCTION public.is_admin_user_storage IS 'Simple admin check for storage policies - fixes ambiguous column reference';
COMMENT ON POLICY "Admin full access to verification docs" ON storage.objects IS 'Allows admin users full access to all verification documents';

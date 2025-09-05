-- =============================================
-- ADMIN STORAGE ACCESS - SIMPLE SOLUTION
-- Creates a service role bypass function for admin document access
-- =============================================

-- Create a secure function that bypasses RLS for admin users
CREATE OR REPLACE FUNCTION admin_get_document_signed_url(
  document_path text,
  expires_in integer DEFAULT 3600
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
  is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) INTO is_admin;
  
  -- Only allow admin users
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Use service role to get signed URL (bypasses RLS)
  SELECT url INTO signed_url
  FROM storage.objects 
  WHERE bucket_id = 'verification-docs' 
  AND name = document_path;
  
  -- If file exists, return a constructed URL
  -- Note: This returns the object info, actual signed URL creation needs to be done client-side
  IF signed_url IS NOT NULL THEN
    RETURN document_path; -- Return path for client-side signed URL creation
  ELSE
    RAISE EXCEPTION 'Document not found: %', document_path;
  END IF;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_document_signed_url TO authenticated;

-- Create a function to check document existence for admins
CREATE OR REPLACE FUNCTION admin_check_document_exists(document_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
  doc_exists boolean;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) INTO is_admin;
  
  -- Only allow admin users
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Check if document exists
  SELECT EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'verification-docs' 
    AND name = document_path
  ) INTO doc_exists;
  
  RETURN doc_exists;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_check_document_exists TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_get_document_signed_url IS 'Allows admin users to access verification documents by bypassing RLS';
COMMENT ON FUNCTION admin_check_document_exists IS 'Allows admin users to check if verification documents exist';

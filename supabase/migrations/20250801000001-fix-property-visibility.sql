-- Fix property visibility by updating RLS policies to ignore is_active status
-- This allows all users to see property details in race cards regardless of property active status

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view images of active properties" ON public.property_images;

-- Create new policies that allow viewing all properties and images
CREATE POLICY "Anyone can view all properties" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view all property images" ON public.property_images
  FOR SELECT USING (true);

-- Keep the owner-specific policies intact for management
-- Property owners can still manage their properties normally
-- Only the public viewing policies have been updated

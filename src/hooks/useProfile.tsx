
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  bio: string | null;
  running_experience: string | null;
  preferred_distances: string[] | null;
  running_modalities: string[] | null;
  personal_records: Record<string, string> | null;
  races_completed_this_year: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_host: boolean;
  is_guest: boolean;
  verification_status: string;
  verification_documents: string[] | null;
  total_host_experiences: number;
  total_guest_experiences: number;
  average_rating: number;
  badges: string[] | null;
  points_balance: number;
  profile_image_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const calculateProgress = (profileData: Profile) => {
    let completed = 0;
    const totalFields = 10;

    if (profileData.first_name) completed++;
    if (profileData.last_name) completed++;
    if (profileData.phone) completed++;
    if (profileData.bio) completed++;
    if (profileData.running_experience) completed++;
    if (profileData.preferred_distances && profileData.preferred_distances.length > 0) completed++;
    if (profileData.emergency_contact_name) completed++;
    if (profileData.emergency_contact_phone) completed++;
    if (profileData.is_host || profileData.is_guest) completed++;
    if (profileData.profile_image_url) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data fetched:', data);
      
      // Cast the data to include our extended fields
      const extendedData = data as any;
      
      // Ensure all required fields are present with proper defaults
      const profileData: Profile = {
        id: extendedData.id,
        first_name: extendedData.first_name || null,
        last_name: extendedData.last_name || null,
        phone: extendedData.phone || null,
        birth_date: extendedData.birth_date || null,
        bio: extendedData.bio || null,
        running_experience: extendedData.running_experience || null,
        preferred_distances: extendedData.preferred_distances || [],
        running_modalities: extendedData.running_modalities || [],
        personal_records: extendedData.personal_records || {},
        races_completed_this_year: extendedData.races_completed_this_year || 0,
        emergency_contact_name: extendedData.emergency_contact_name || null,
        emergency_contact_phone: extendedData.emergency_contact_phone || null,
        is_host: extendedData.is_host || false,
        is_guest: extendedData.is_guest || false,
        verification_status: extendedData.verification_status || 'pending',
        verification_documents: extendedData.verification_documents || [],
        total_host_experiences: extendedData.total_host_experiences || 0,
        total_guest_experiences: extendedData.total_guest_experiences || 0,
        average_rating: extendedData.average_rating || 0,
        badges: extendedData.badges || [],
        points_balance: extendedData.points_balance || 0,
        profile_image_url: extendedData.profile_image_url || null
      };
      
      setProfile(profileData);

      // Calculate progress using frontend logic
      const calculatedProgress = calculateProgress(profileData);
      setProgress(calculatedProgress);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      console.log('Updating profile with:', updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Recalculate progress using frontend logic
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        const calculatedProgress = calculateProgress(updatedProfile);
        setProgress(calculatedProgress);
      }

      toast.success('Perfil actualizado correctamente');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ profile_image_url: data.publicUrl });
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir la foto de perfil');
      return null;
    }
  };

  const uploadVerificationDoc = async (file: File, docType: string) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const currentDocs = profile?.verification_documents || [];
      const newDocs = [...currentDocs, fileName];
      
      await updateProfile({ verification_documents: newDocs });
      return fileName;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      toast.error('Error al subir el documento de verificación');
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    progress,
    updateProfile,
    refetchProfile: fetchProfile
  };
};

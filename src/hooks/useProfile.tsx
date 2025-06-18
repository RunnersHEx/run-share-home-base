
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

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Calculate progress
      const { data: progressData, error: progressError } = await supabase
        .rpc('calculate_profile_progress', { user_id: user.id });

      if (!progressError) {
        setProgress(progressData || 0);
      }
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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Recalculate progress
      const { data: progressData } = await supabase
        .rpc('calculate_profile_progress', { user_id: user.id });
      
      if (progressData) {
        setProgress(progressData);
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
    uploadAvatar,
    uploadVerificationDoc,
    refetchProfile: fetchProfile
  };
};

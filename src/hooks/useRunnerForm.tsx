
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RunnerFormData {
  // Información básica
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  
  // Información del corredor
  bio: string;
  running_experience: string;
  preferred_distances: string[];
  running_modalities: string[];
  personal_records: Record<string, string>;
  races_completed_this_year: number;
  
  // Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Roles
  isHost: boolean;
  isGuest: boolean;
}

export const useRunnerForm = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    bio: '',
    running_experience: '',
    preferred_distances: [],
    running_modalities: [],
    personal_records: {},
    races_completed_this_year: 0
  });

  // Sincronizar formData con profile cuando cambie
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        running_experience: profile.running_experience || '',
        preferred_distances: profile.preferred_distances || [],
        running_modalities: profile.running_modalities || [],
        personal_records: profile.personal_records || {},
        races_completed_this_year: profile.races_completed_this_year || 0
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        toast.success("Información actualizada correctamente");
      }
    } catch (error) {
      console.error('Error saving runner info:', error);
      toast.error("Error al guardar la información");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales del perfil
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        running_experience: profile.running_experience || '',
        preferred_distances: profile.preferred_distances || [],
        running_modalities: profile.running_modalities || [],
        personal_records: profile.personal_records || {},
        races_completed_this_year: profile.races_completed_this_year || 0
      });
    }
    setIsEditing(false);
  };

  const saveRunnerProfile = async (formData: RunnerFormData) => {
    if (!user) {
      toast.error("No hay usuario autenticado");
      return false;
    }

    setLoading(true);
    try {
      console.log('Saving runner profile:', formData);
      
      // Preparar los datos para la base de datos
      const profileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        birth_date: formData.birthDate,
        bio: formData.bio,
        running_experience: formData.running_experience,
        preferred_distances: formData.preferred_distances,
        running_modalities: formData.running_modalities,
        personal_records: formData.personal_records,
        races_completed_this_year: formData.races_completed_this_year,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        is_host: formData.isHost,
        is_guest: formData.isGuest
      };

      // Usar upsert para crear o actualizar el perfil
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, ...profileData },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Error saving profile:', error);
        throw error;
      }

      console.log('Profile saved successfully');
      toast.success("Perfil guardado correctamente");
      return true;
    } catch (error) {
      console.error('Error in saveRunnerProfile:', error);
      toast.error("Error al guardar el perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel,
    saveRunnerProfile,
    loading
  };
};

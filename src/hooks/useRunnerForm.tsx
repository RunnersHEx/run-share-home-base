
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RunningExperience } from "@/types/profile";

export interface RunnerFormData {
  // Información básica
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  
  // Información del corredor
  bio: string;
  running_experience: RunningExperience | null;
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
  // Simplified form state management - same for all users regardless of roles
  const [formData, setFormData] = useState<any>({
    bio: '',
    running_experience: null,
    preferred_distances: [],
    running_modalities: [],
    personal_records: {},
    races_completed_this_year: 0
  });
  
  // Prevent re-renders during state transitions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Simplified form synchronization - prevent conflicts for dual-role users
  useEffect(() => {
    if (profile && !isUpdating && !isSaving && !isEditing) {
      const safeFormData = {
        bio: profile.bio || '',
        running_experience: profile.running_experience || null,
        preferred_distances: Array.isArray(profile.preferred_distances) ? [...profile.preferred_distances] : [],
        running_modalities: Array.isArray(profile.running_modalities) ? [...profile.running_modalities] : [],
        personal_records: profile.personal_records && typeof profile.personal_records === 'object' 
          ? { ...profile.personal_records } 
          : {},
        races_completed_this_year: Number(profile.races_completed_this_year) || 0
      };
      
      // Only update form data on initial load or when explicitly not editing
      if (!isInitialized) {
        setFormData(safeFormData);
        setIsInitialized(true);
      }
    }
  }, [profile, isUpdating, isSaving, isInitialized, isEditing]);

  const handleSave = async () => {
    if (!profile || isUpdating || isSaving) return;

    // Prevent any state synchronization during save
    setIsUpdating(true);
    setIsSaving(true);
    
    try {
      console.log('useRunnerForm: Saving runner form data:', formData);
      
      const dataToSave = {
        bio: formData.bio || '',
        running_experience: formData.running_experience || null,
        preferred_distances: Array.isArray(formData.preferred_distances) 
          ? [...formData.preferred_distances] 
          : [],
        running_modalities: Array.isArray(formData.running_modalities) 
          ? [...formData.running_modalities] 
          : [],
        personal_records: (formData.personal_records && typeof formData.personal_records === 'object' && !Array.isArray(formData.personal_records)) 
          ? { ...formData.personal_records }
          : {},
        races_completed_this_year: Number(formData.races_completed_this_year) || 0
      };
      
      console.log('useRunnerForm: Data to save:', dataToSave);
      
      const success = await updateProfile(dataToSave);
      if (success) {
        // Force a clean state reset after successful save
        setTimeout(() => {
          setIsEditing(false);
          // Force component remount by updating a key
          const event = new CustomEvent('profile-updated', { 
            detail: { timestamp: Date.now() } 
          });
          window.dispatchEvent(event);
        }, 100);
        toast.success("Información actualizada correctamente");
      }
    } catch (error) {
      console.error('Error saving runner info:', error);
      toast.error("Error al guardar la información");
    } finally {
      setIsSaving(false);
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (isUpdating || isSaving) return;
    
    setIsUpdating(true);
    
    // Prevent any state synchronization during cancel
    const originalData = profile ? {
      bio: profile.bio || '',
      running_experience: profile.running_experience || null,
      preferred_distances: Array.isArray(profile.preferred_distances) ? [...profile.preferred_distances] : [],
      running_modalities: Array.isArray(profile.running_modalities) ? [...profile.running_modalities] : [],
      personal_records: profile.personal_records && typeof profile.personal_records === 'object' 
        ? { ...profile.personal_records } 
        : {},
      races_completed_this_year: Number(profile.races_completed_this_year) || 0
    } : formData;
    
    // Use setTimeout to prevent DOM conflicts
    setTimeout(() => {
      setFormData(originalData);
      setIsEditing(false);
      setIsUpdating(false);
    }, 50);
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
    isUpdating, // Export the updating state
    handleSave,
    handleCancel,
    saveRunnerProfile,
    loading
  };
};

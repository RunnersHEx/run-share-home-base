
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  runningExperience: string;
  preferredDistances: string[];
  runningModalities: string[];
  personalRecords: Record<string, string>;
  racesCompletedThisYear: number;
  
  // Contacto de emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Roles
  isHost: boolean;
  isGuest: boolean;
}

export const useRunnerForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

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
        running_experience: formData.runningExperience,
        preferred_distances: formData.preferredDistances,
        running_modalities: formData.runningModalities,
        personal_records: formData.personalRecords,
        races_completed_this_year: formData.racesCompletedThisYear,
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
    saveRunnerProfile,
    loading
  };
};

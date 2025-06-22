
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

export const useRunnerForm = () => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    running_experience: '0-1',
    running_modalities: [] as string[],
    preferred_distances: [] as string[],
    bio: '',
    personal_records: {} as Record<string, string>,
    races_completed_this_year: 0,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        running_experience: profile.running_experience || '0-1',
        running_modalities: profile.running_modalities || [],
        preferred_distances: profile.preferred_distances || [],
        bio: profile.bio || '',
        personal_records: profile.personal_records || {},
        races_completed_this_year: profile.races_completed_this_year || 0,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        running_experience: profile.running_experience || '0-1',
        running_modalities: profile.running_modalities || [],
        preferred_distances: profile.preferred_distances || [],
        bio: profile.bio || '',
        personal_records: profile.personal_records || {},
        races_completed_this_year: profile.races_completed_this_year || 0,
      });
    }
    setIsEditing(false);
  };

  return {
    profile,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  };
};

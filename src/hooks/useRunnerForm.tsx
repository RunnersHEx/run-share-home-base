
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

export const useRunnerForm = () => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    running_experience: 'beginner',
    running_modalities: [] as string[],
    preferred_distances: [] as string[],
    bio: '',
    personal_records: {} as Record<string, string>,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        running_experience: profile.running_experience || 'beginner',
        running_modalities: profile.running_modalities || [],
        preferred_distances: profile.preferred_distances || [],
        bio: profile.bio || '',
        personal_records: profile.personal_records || {},
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Saving runner form data:', formData);
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        running_experience: profile.running_experience || 'beginner',
        running_modalities: profile.running_modalities || [],
        preferred_distances: profile.preferred_distances || [],
        bio: profile.bio || '',
        personal_records: profile.personal_records || {},
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

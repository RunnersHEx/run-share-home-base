
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRunnerForm } from "@/hooks/useRunnerForm";
import { Save, Trophy } from "lucide-react";
import { useCallback } from "react";
import RunnerExperienceSection from "./runner/RunnerExperienceSection";
import RunnerModalitiesSection from "./runner/RunnerModalitiesSection";
import RunnerDistancesSection from "./runner/RunnerDistancesSection";
import RunnerBioSection from "./runner/RunnerBioSection";
import RunnerPersonalRecordsSection from "./runner/RunnerPersonalRecordsSection";
import { RunningExperience } from "@/types/profile";

const RunnerInfoSection = () => {
  const {
    profile,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSaving,
    isUpdating,
    handleSave,
    handleCancel
  } = useRunnerForm();

  // Memoize all handlers to prevent unnecessary re-renders
  const handleExperienceChange = useCallback((experience: RunningExperience) => {
    setFormData(prev => ({
      ...prev,
      running_experience: experience
    }));
  }, [setFormData]);

  const handleModalityChange = useCallback((modality: string, checked: boolean) => {
    const currentModalities = formData.running_modalities || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        running_modalities: [...currentModalities, modality]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        running_modalities: currentModalities.filter(m => m !== modality)
      }));
    }
  }, [formData.running_modalities, setFormData]);

  const handleDistanceChange = useCallback((distance: string, checked: boolean) => {
    const currentDistances = formData.preferred_distances || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preferred_distances: [...currentDistances, distance]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferred_distances: currentDistances.filter(d => d !== distance)
      }));
    }
  }, [formData.preferred_distances, setFormData]);

  const handlePersonalRecordChange = useCallback((distance: string, time: string) => {
    setFormData(prev => ({
      ...prev,
      personal_records: {
        ...prev.personal_records,
        [distance]: time
      }
    }));
  }, [setFormData]);

  const handleBioChange = useCallback((bio: string) => {
    setFormData(prev => ({ ...prev, bio }));
  }, [setFormData]);

  return (
    <div className={`transition-opacity duration-200 ${isUpdating ? 'opacity-75 pointer-events-none' : 'opacity-100'}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              <span>Información del Corredor</span>
            </div>
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline" 
                size="sm"
                disabled={isUpdating}
              >
                Editar
              </Button>
            ) : (
              <div className="space-x-2">
                <Button 
                  onClick={handleCancel} 
                  variant="outline" 
                  size="sm"
                  disabled={isSaving || isUpdating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  size="sm" 
                  disabled={isSaving || isUpdating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700">
                🏃‍♂️ Haz clic en "Editar" para completar tu perfil runner
              </p>
            </div>
          )}

          <RunnerExperienceSection
            experience={formData.running_experience}
            isEditing={isEditing}
            onExperienceChange={handleExperienceChange}
          />

          <RunnerModalitiesSection
            modalities={formData.running_modalities}
            isEditing={isEditing}
            onModalityChange={handleModalityChange}
          />

          <RunnerDistancesSection
            distances={formData.preferred_distances}
            isEditing={isEditing}
            onDistanceChange={handleDistanceChange}
          />

          <RunnerBioSection
            bio={formData.bio}
            isEditing={isEditing}
            profileBio={profile?.bio}
            onBioChange={handleBioChange}
          />

          <RunnerPersonalRecordsSection
            personalRecords={formData.personal_records}
            isEditing={isEditing}
            profileRecords={profile?.personal_records}
            onRecordChange={handlePersonalRecordChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RunnerInfoSection;

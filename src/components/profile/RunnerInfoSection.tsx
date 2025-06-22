
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRunnerForm } from "@/hooks/useRunnerForm";
import { Save, Trophy } from "lucide-react";
import RunnerExperienceSection from "./runner/RunnerExperienceSection";
import RunnerModalitiesSection from "./runner/RunnerModalitiesSection";
import RunnerDistancesSection from "./runner/RunnerDistancesSection";
import RunnerBioSection from "./runner/RunnerBioSection";
import RunnerPersonalRecordsSection from "./runner/RunnerPersonalRecordsSection";
import RunnerRacesSection from "./runner/RunnerRacesSection";

const RunnerInfoSection = () => {
  const {
    profile,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  } = useRunnerForm();

  const handleModalityChange = (modality: string, checked: boolean) => {
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
  };

  const handleDistanceChange = (distance: string, checked: boolean) => {
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
  };

  const handlePersonalRecordChange = (distance: string, time: string) => {
    setFormData(prev => ({
      ...prev,
      personal_records: {
        ...prev.personal_records,
        [distance]: time
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            <span>Información de Corredor</span>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
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
          onExperienceChange={(experience) => setFormData(prev => ({ ...prev, running_experience: experience }))}
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
          onBioChange={(bio) => setFormData(prev => ({ ...prev, bio }))}
        />

        <RunnerPersonalRecordsSection
          personalRecords={formData.personal_records}
          isEditing={isEditing}
          profileRecords={profile?.personal_records}
          onRecordChange={handlePersonalRecordChange}
        />

        <RunnerRacesSection
          racesCompleted={formData.races_completed_this_year}
          isEditing={isEditing}
          profileRaces={profile?.races_completed_this_year}
          onRacesChange={(races) => setFormData(prev => ({ ...prev, races_completed_this_year: races }))}
        />
      </CardContent>
    </Card>
  );
};

export default RunnerInfoSection;

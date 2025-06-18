
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { Save, Trophy } from "lucide-react";

const RunnerInfoSection = () => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    running_experience: profile?.running_experience || '0-1',
    running_modalities: profile?.running_modalities || [],
    preferred_distances: profile?.preferred_distances || [],
    bio: profile?.bio || '',
    personal_records: profile?.personal_records || {},
    races_completed_this_year: profile?.races_completed_this_year || 0,
  });

  const experienceOptions = [
    { value: '0-1', label: 'Menos de 1 año' },
    { value: '1-3', label: '1-3 años' },
    { value: '3-5', label: '3-5 años' },
    { value: '5-10', label: '5-10 años' },
    { value: '10+', label: 'Más de 10 años' },
  ];

  const modalityOptions = [
    { value: 'ruta-asfalto', label: 'Ruta/Asfalto' },
    { value: 'trail-montana', label: 'Trail/Montaña' },
  ];

  const distanceOptions = [
    { value: '5k', label: '5K' },
    { value: '10k', label: '10K' },
    { value: '21k', label: 'Media Maratón (21K)' },
    { value: '42k', label: 'Maratón (42K)' },
    { value: 'ultra', label: 'Ultra (>42K)' },
  ];

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

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      running_experience: profile?.running_experience || '0-1',
      running_modalities: profile?.running_modalities || [],
      preferred_distances: profile?.preferred_distances || [],
      bio: profile?.bio || '',
      personal_records: profile?.personal_records || {},
      races_completed_this_year: profile?.races_completed_this_year || 0,
    });
    setIsEditing(false);
  };

  const getExperienceYears = () => {
    const exp = formData.running_experience;
    if (exp === '0-1') return [1];
    if (exp === '1-3') return [2];
    if (exp === '3-5') return [4];
    if (exp === '5-10') return [7];
    if (exp === '10+') return [15];
    return [1];
  };

  const setExperienceFromSlider = (value: number[]) => {
    const years = value[0];
    if (years <= 1) setFormData(prev => ({ ...prev, running_experience: '0-1' }));
    else if (years <= 3) setFormData(prev => ({ ...prev, running_experience: '1-3' }));
    else if (years <= 5) setFormData(prev => ({ ...prev, running_experience: '3-5' }));
    else if (years <= 10) setFormData(prev => ({ ...prev, running_experience: '5-10' }));
    else setFormData(prev => ({ ...prev, running_experience: '10+' }));
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
        {/* Experiencia */}
        <div className="space-y-4">
          <Label>Años de experiencia corriendo</Label>
          <div className="px-3">
            <Slider
              value={getExperienceYears()}
              onValueChange={setExperienceFromSlider}
              max={30}
              min={0}
              step={1}
              disabled={!isEditing}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>0 años</span>
              <span className="font-medium text-blue-600">
                {experienceOptions.find(opt => opt.value === formData.running_experience)?.label}
              </span>
              <span>30+ años</span>
            </div>
          </div>
        </div>

        {/* Modalidades */}
        <div className="space-y-3">
          <Label>Modalidad de carreras preferidas</Label>
          <div className="space-y-2">
            {modalityOptions.map((modality) => (
              <div key={modality.value} className="flex items-center space-x-2">
                <Checkbox
                  id={modality.value}
                  checked={formData.running_modalities?.includes(modality.value) || false}
                  onCheckedChange={(checked) => handleModalityChange(modality.value, checked as boolean)}
                  disabled={!isEditing}
                />
                <Label htmlFor={modality.value}>{modality.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Distancias preferidas */}
        <div className="space-y-3">
          <Label>Distancias que más te gusta correr</Label>
          <div className="grid grid-cols-2 gap-2">
            {distanceOptions.map((distance) => (
              <div key={distance.value} className="flex items-center space-x-2">
                <Checkbox
                  id={distance.value}
                  checked={formData.preferred_distances?.includes(distance.value) || false}
                  onCheckedChange={(checked) => handleDistanceChange(distance.value, checked as boolean)}
                  disabled={!isEditing}
                />
                <Label htmlFor={distance.value} className="text-sm">{distance.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label>Cuéntanos sobre ti como corredor</Label>
          <Textarea
            placeholder="Háblanos de tu pasión por el running, objetivos, experiencias..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            maxLength={500}
            rows={4}
          />
          <div className="text-right text-sm text-gray-500">
            {formData.bio.length}/500 caracteres
          </div>
        </div>

        {/* Marcas personales */}
        <div className="space-y-4">
          <Label>Mejores marcas personales (opcional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['5k', '10k', '21k', '42k'].map((distance) => (
              <div key={distance} className="space-y-2">
                <Label htmlFor={`pr-${distance}`}>
                  {distance === '21k' ? 'Media Maratón' : distance === '42k' ? 'Maratón' : distance.toUpperCase()}
                </Label>
                <Input
                  id={`pr-${distance}`}
                  placeholder="ej: 22:30"
                  value={formData.personal_records[distance] || ''}
                  onChange={(e) => handlePersonalRecordChange(distance, e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Carreras completadas */}
        <div className="space-y-2">
          <Label htmlFor="races_completed">Carreras completadas este año</Label>
          <Input
            id="races_completed"
            type="number"
            min="0"
            value={formData.races_completed_this_year}
            onChange={(e) => setFormData(prev => ({ ...prev, races_completed_this_year: parseInt(e.target.value) || 0 }))}
            disabled={!isEditing}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default RunnerInfoSection;

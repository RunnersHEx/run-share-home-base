
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface RunnerProfileFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isLoading: boolean;
}

const RunnerProfileForm = ({ onSubmit, onBack, initialData, isLoading }: RunnerProfileFormProps) => {
  const [formData, setFormData] = useState({
    bio: initialData.bio || "",
    runningExperience: initialData.runningExperience || "",
    preferredDistances: initialData.preferredDistances || [],
    runningModalities: initialData.runningModalities || [],
    personalRecords: initialData.personalRecords || {}
  });

  const distances = ["5K", "10K", "21K", "Maratón", "Ultra"];
  const modalities = ["Ruta/Asfalto", "Trail/Montaña"];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDistanceChange = (distance: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preferredDistances: [...prev.preferredDistances, distance]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferredDistances: prev.preferredDistances.filter(d => d !== distance)
      }));
    }
  };

  const handleModalityChange = (modality: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        runningModalities: [...prev.runningModalities, modality]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        runningModalities: prev.runningModalities.filter(m => m !== modality)
      }));
    }
  };

  const handleRecordChange = (distance: string, time: string) => {
    setFormData(prev => ({
      ...prev,
      personalRecords: {
        ...prev.personalRecords,
        [distance]: time
      }
    }));
  };

  const isFormValid = () => {
    return (
      formData.runningExperience &&
      formData.bio.trim() &&
      formData.preferredDistances.length > 0 &&
      formData.runningModalities.length > 0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Perfil Runner</h3>
      
      <div className="space-y-2">
        <Label htmlFor="runningExperience">Experiencia Corriendo *</Label>
        <Select value={formData.runningExperience} onValueChange={(value) => handleInputChange("runningExperience", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="principiante">Principiante (0-1 año)</SelectItem>
            <SelectItem value="intermedio">Intermedio (1-3 años)</SelectItem>
            <SelectItem value="avanzado">Avanzado (3-5 años)</SelectItem>
            <SelectItem value="experto">Experto (5+ años)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografía Runner *</Label>
        <Textarea
          id="bio"
          placeholder="Cuéntanos sobre ti como runner..."
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Distancias Preferidas *</Label>
        <div className="grid grid-cols-3 gap-3">
          {distances.map((distance) => (
            <div key={distance} className="flex items-center space-x-2">
              <Checkbox 
                id={distance}
                checked={formData.preferredDistances.includes(distance)}
                onCheckedChange={(checked) => handleDistanceChange(distance, !!checked)}
              />
              <Label htmlFor={distance} className="text-sm">{distance}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Modalidades *</Label>
        <div className="grid grid-cols-2 gap-3">
          {modalities.map((modality) => (
            <div key={modality} className="flex items-center space-x-2">
              <Checkbox 
                id={modality}
                checked={formData.runningModalities.includes(modality)}
                onCheckedChange={(checked) => handleModalityChange(modality, !!checked)}
              />
              <Label htmlFor={modality} className="text-sm">{modality}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Records Personales (opcional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {["5K", "10K", "21K", "Maratón"].map((distance) => (
            <div key={distance} className="space-y-1">
              <Label htmlFor={`record-${distance}`} className="text-sm">{distance}</Label>
              <Input
                id={`record-${distance}`}
                placeholder="00:00:00"
                value={formData.personalRecords[distance] || ''}
                onChange={(e) => handleRecordChange(distance, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-blue-600 hover:bg-blue-700" 
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? "Guardando..." : "Continuar"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};

export default RunnerProfileForm;

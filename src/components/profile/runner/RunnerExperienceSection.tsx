
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RunnerExperienceSectionProps {
  experience: string;
  isEditing: boolean;
  onExperienceChange: (experience: string) => void;
}

const experienceOptions = [
  { value: 'beginner', label: 'Principiante (menos de 1 año)' },
  { value: 'intermediate', label: 'Intermedio (1-3 años)' },
  { value: 'advanced', label: 'Avanzado (3-5 años)' },
  { value: 'expert', label: 'Experto (5-10 años)' },
  { value: 'elite', label: 'Elite (más de 10 años)' },
];

const RunnerExperienceSection = ({ experience, isEditing, onExperienceChange }: RunnerExperienceSectionProps) => {
  const selectedOption = experienceOptions.find(opt => opt.value === experience);

  return (
    <div className="space-y-2">
      <Label>Años de experiencia corriendo</Label>
      {isEditing ? (
        <Select value={experience} onValueChange={onExperienceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel de experiencia" />
          </SelectTrigger>
          <SelectContent>
            {experienceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
          {selectedOption?.label || "No especificado"}
        </div>
      )}
    </div>
  );
};

export default RunnerExperienceSection;

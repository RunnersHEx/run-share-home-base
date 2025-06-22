
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RunnerModalitiesSectionProps {
  modalities: string[];
  isEditing: boolean;
  onModalityChange: (modality: string, checked: boolean) => void;
}

const modalityOptions = [
  { value: 'ruta-asfalto', label: 'Ruta/Asfalto' },
  { value: 'trail-montana', label: 'Trail/Montaña' },
];

const RunnerModalitiesSection = ({ modalities, isEditing, onModalityChange }: RunnerModalitiesSectionProps) => {
  return (
    <div className="space-y-3">
      <Label>Modalidad de carreras preferidas</Label>
      <div className="space-y-2">
        {modalityOptions.map((modality) => (
          <div key={modality.value} className="flex items-center space-x-2">
            <Checkbox
              id={modality.value}
              checked={modalities?.includes(modality.value) || false}
              onCheckedChange={(checked) => onModalityChange(modality.value, checked as boolean)}
              disabled={!isEditing}
            />
            <Label htmlFor={modality.value}>{modality.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RunnerModalitiesSection;

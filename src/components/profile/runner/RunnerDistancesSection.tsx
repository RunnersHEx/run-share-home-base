
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RunnerDistancesSectionProps {
  distances: string[];
  isEditing: boolean;
  onDistanceChange: (distance: string, checked: boolean) => void;
}

const distanceOptions = [
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: '21k', label: 'Media Maratón (21K)' },
  { value: '42k', label: 'Maratón (42K)' },
  { value: 'ultra', label: 'Ultra (>42K)' },
];

const RunnerDistancesSection = ({ distances, isEditing, onDistanceChange }: RunnerDistancesSectionProps) => {
  return (
    <div className="space-y-3">
      <Label>Distancias que más te gusta correr</Label>
      <div className="grid grid-cols-2 gap-2">
        {distanceOptions.map((distance) => (
          <div key={distance.value} className="flex items-center space-x-2">
            <Checkbox
              id={distance.value}
              checked={distances?.includes(distance.value) || false}
              onCheckedChange={(checked) => onDistanceChange(distance.value, checked as boolean)}
              disabled={!isEditing}
            />
            <Label htmlFor={distance.value} className="text-sm">{distance.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RunnerDistancesSection;

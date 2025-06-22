
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RunnerPersonalRecordsSectionProps {
  personalRecords: Record<string, string>;
  isEditing: boolean;
  profileRecords?: Record<string, string>;
  onRecordChange: (distance: string, time: string) => void;
}

const RunnerPersonalRecordsSection = ({ 
  personalRecords, 
  isEditing, 
  profileRecords, 
  onRecordChange 
}: RunnerPersonalRecordsSectionProps) => {
  const distances = [
    { key: '5k', label: '5K', example: 'Ej: 00:23:00' },
    { key: '10k', label: '10K', example: 'Ej: 00:58:24' },
    { key: '21k', label: 'Media Maratón', example: 'Ej: 01:33:56' },
    { key: '42k', label: 'Maratón', example: 'Ej: 03:33:12' }
  ];

  return (
    <div className="space-y-4">
      <Label>Mejores marcas personales (opcional)</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {distances.map((distance) => (
          <div key={distance.key} className="space-y-2">
            <Label htmlFor={`pr-${distance.key}`}>{distance.label}</Label>
            <Input
              id={`pr-${distance.key}`}
              placeholder={isEditing ? distance.example : ""}
              value={isEditing ? (personalRecords[distance.key] || '') : (profileRecords?.[distance.key] || "No especificado")}
              onChange={(e) => onRecordChange(distance.key, e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RunnerPersonalRecordsSection;


import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RunnerRacesSectionProps {
  racesCompleted: number;
  isEditing: boolean;
  profileRaces?: number;
  onRacesChange: (races: number) => void;
}

const RunnerRacesSection = ({ racesCompleted, isEditing, profileRaces, onRacesChange }: RunnerRacesSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="races_completed">Carreras completadas este año</Label>
      <Input
        id="races_completed"
        type="number"
        min="0"
        value={isEditing ? racesCompleted : (profileRaces || 0)}
        onChange={(e) => onRacesChange(parseInt(e.target.value) || 0)}
        disabled={!isEditing}
        className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
        placeholder={isEditing ? "Número de carreras" : ""}
      />
    </div>
  );
};

export default RunnerRacesSection;

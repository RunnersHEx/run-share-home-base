
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy } from "lucide-react";

interface RunnerProfileFormProps {
  formData: {
    runningExperience: string;
    raceModality: string;
    preferredRaceTypes: string[];
    bio: string;
  };
  onInputChange: (field: string, value: any) => void;
  onRaceTypeToggle: (raceType: string) => void;
}

const RunnerProfileForm = ({ formData, onInputChange, onRaceTypeToggle }: RunnerProfileFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <Trophy className="mr-2 h-5 w-5 text-orange-500" />
        Perfil Runner
      </h3>

      <div className="space-y-2">
        <Label htmlFor="runningExperience">Años de experiencia corriendo</Label>
        <Select onValueChange={(value) => onInputChange("runningExperience", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu experiencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1">Menos de 1 año</SelectItem>
            <SelectItem value="1-3">1-3 años</SelectItem>
            <SelectItem value="3-5">3-5 años</SelectItem>
            <SelectItem value="5-10">5-10 años</SelectItem>
            <SelectItem value="10+">Más de 10 años</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Modalidad de carreras preferidas</Label>
        <RadioGroup 
          value={formData.raceModality} 
          onValueChange={(value) => onInputChange("raceModality", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ruta-asfalto" id="ruta-asfalto" />
            <Label htmlFor="ruta-asfalto">Ruta/Asfalto</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="trail-montana" id="trail-montana" />
            <Label htmlFor="trail-montana">Trail/Montaña</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ambos" id="ambos" />
            <Label htmlFor="ambos">Ambos</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Distancias que más te gusta correr (selecciona varias)</Label>
        <div className="grid grid-cols-2 gap-2">
          {["5K", "10K", "Media Maratón", "Maratón", "Ultra"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={type}
                checked={formData.preferredRaceTypes.includes(type)}
                onCheckedChange={() => onRaceTypeToggle(type)}
              />
              <Label htmlFor={type} className="text-sm">{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Cuéntanos sobre ti</Label>
        <textarea
          id="bio"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Háblanos de tu experiencia corriendo, motivaciones, logros..."
          value={formData.bio}
          onChange={(e) => onInputChange("bio", e.target.value)}
        />
      </div>
    </div>
  );
};

export default RunnerProfileForm;

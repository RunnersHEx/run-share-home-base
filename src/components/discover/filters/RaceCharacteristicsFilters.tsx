
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy } from "lucide-react";
import { RaceModality, RaceDistance, TerrainProfile } from "@/types/race";

interface RaceCharacteristicsFiltersProps {
  selectedModalities: RaceModality[];
  onModalityChange: (modality: RaceModality, checked: boolean) => void;
  selectedDistances: RaceDistance[];
  onDistanceChange: (distance: RaceDistance, checked: boolean) => void;
  selectedTerrainProfiles: TerrainProfile[];
  onTerrainChange: (terrain: TerrainProfile, checked: boolean) => void;
}

export const RaceCharacteristicsFilters = ({
  selectedModalities,
  onModalityChange,
  selectedDistances,
  onDistanceChange,
  selectedTerrainProfiles,
  onTerrainChange
}: RaceCharacteristicsFiltersProps) => {
  const distances = [
    { id: 'ultra' as RaceDistance, label: 'Ultra' },
    { id: 'marathon' as RaceDistance, label: 'Maratón' },
    { id: 'half_marathon' as RaceDistance, label: 'Media Maratón' },
    { id: '20k' as RaceDistance, label: '20K' },
    { id: '15k' as RaceDistance, label: '15K' },
    { id: '10k' as RaceDistance, label: '10K' },
    { id: '5k' as RaceDistance, label: '5K' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#1E40AF]" />
        <h3 className="font-semibold">Características de Carrera</h3>
      </div>
      
      <div className="space-y-4">
        {/* Modalidad */}
        <div>
          <Label className="text-sm font-medium">Modalidad carrera</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="road"
                checked={selectedModalities.includes('road')}
                onCheckedChange={(checked) => onModalityChange('road', checked as boolean)}
              />
              <Label htmlFor="road" className="text-sm">Ruta/Asfalto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="trail"
                checked={selectedModalities.includes('trail')}
                onCheckedChange={(checked) => onModalityChange('trail', checked as boolean)}
              />
              <Label htmlFor="trail" className="text-sm">Trail/Montaña</Label>
            </div>
          </div>
        </div>



        {/* Distancias */}
        <div>
          <Label className="text-sm font-medium">Distancia/s carrera</Label>
          <div className="mt-2 space-y-2">
            {distances.map((distance) => (
              <div key={distance.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={distance.id}
                  checked={selectedDistances.includes(distance.id)}
                  onCheckedChange={(checked) => onDistanceChange(distance.id, checked as boolean)}
                />
                <Label htmlFor={distance.id} className="text-sm">{distance.label}</Label>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

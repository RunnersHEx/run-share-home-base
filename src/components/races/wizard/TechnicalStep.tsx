
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RaceFormData, RaceModality, TerrainProfile, RaceDistance } from "@/types/race";
import { Road, Mountain, Trophy } from "lucide-react";

interface TechnicalStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

export const TechnicalStep = ({ formData, onUpdate }: TechnicalStepProps) => {
  const modalities: { value: RaceModality; label: string; icon: React.ReactNode }[] = [
    { value: 'road', label: 'Ruta/Asfalto', icon: <Road className="w-5 h-5" /> },
    { value: 'trail', label: 'Trail/Montaña', icon: <Mountain className="w-5 h-5" /> }
  ];

  const terrainProfiles: { value: TerrainProfile; label: string }[] = [
    { value: 'flat', label: 'Llano' },
    { value: 'hilly', label: 'Con desnivel' }
  ];

  const distances: { value: RaceDistance; label: string; description: string }[] = [
    { value: 'ultra', label: 'Ultra', description: '+42.195K' },
    { value: 'marathon', label: 'Maratón', description: '42.195K' },
    { value: 'half_marathon', label: 'Media Maratón', description: '21.1K' },
    { value: '20k', label: '20K', description: '20 kilómetros' },
    { value: '15k', label: '15K', description: '15 kilómetros' },
    { value: '10k', label: '10K', description: '10 kilómetros' },
    { value: '5k', label: '5K', description: '5 kilómetros' }
  ];

  const handleModalityChange = (modality: RaceModality, checked: boolean) => {
    const current = formData.modalities || [];
    const updated = checked 
      ? [...current, modality]
      : current.filter(m => m !== modality);
    onUpdate({ modalities: updated });
  };

  const handleTerrainChange = (terrain: TerrainProfile, checked: boolean) => {
    const current = formData.terrain_profile || [];
    const updated = checked 
      ? [...current, terrain]
      : current.filter(t => t !== terrain);
    onUpdate({ terrain_profile: updated });
  };

  const handleDistanceChange = (distance: RaceDistance, checked: boolean) => {
    const current = formData.distances || [];
    const updated = checked 
      ? [...current, distance]
      : current.filter(d => d !== distance);
    onUpdate({ distances: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Características Técnicas</h3>
        <p className="text-gray-600 mb-6">
          Define las características técnicas de la carrera
        </p>
      </div>

      {/* Modalidad de Carrera */}
      <div>
        <Label className="text-base font-medium">Modalidad de Carrera *</Label>
        <p className="text-sm text-gray-600 mb-4">Selecciona todas las modalidades que apliquen</p>
        <div className="grid grid-cols-2 gap-4">
          {modalities.map((modality) => (
            <div key={modality.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={`modality-${modality.value}`}
                checked={formData.modalities?.includes(modality.value) || false}
                onCheckedChange={(checked) => handleModalityChange(modality.value, checked as boolean)}
              />
              <label
                htmlFor={`modality-${modality.value}`}
                className="flex items-center space-x-2 cursor-pointer flex-1"
              >
                {modality.icon}
                <span>{modality.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Perfil del Recorrido */}
      <div>
        <Label className="text-base font-medium">Perfil del Recorrido</Label>
        <p className="text-sm text-gray-600 mb-4">Describe el tipo de terreno</p>
        <div className="grid grid-cols-2 gap-4">
          {terrainProfiles.map((terrain) => (
            <div key={terrain.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={`terrain-${terrain.value}`}
                checked={formData.terrain_profile?.includes(terrain.value) || false}
                onCheckedChange={(checked) => handleTerrainChange(terrain.value, checked as boolean)}
              />
              <label
                htmlFor={`terrain-${terrain.value}`}
                className="cursor-pointer flex-1"
              >
                {terrain.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Distancias de Carrera */}
      <div>
        <Label className="text-base font-medium">Distancias de Carrera *</Label>
        <p className="text-sm text-gray-600 mb-4">Selecciona todas las distancias disponibles</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {distances.map((distance) => (
            <div key={distance.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id={`distance-${distance.value}`}
                checked={formData.distances?.includes(distance.value) || false}
                onCheckedChange={(checked) => handleDistanceChange(distance.value, checked as boolean)}
              />
              <label
                htmlFor={`distance-${distance.value}`}
                className="cursor-pointer flex-1"
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-[#EA580C]" />
                  <div>
                    <div className="font-medium">{distance.label}</div>
                    <div className="text-xs text-gray-500">{distance.description}</div>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Cajones de Salida */}
      <div>
        <Label className="text-base font-medium">Cajones de Salida según Marcas</Label>
        <div className="flex items-center space-x-3 mt-4">
          <Checkbox
            id="has_wave_starts"
            checked={formData.has_wave_starts || false}
            onCheckedChange={(checked) => onUpdate({ has_wave_starts: checked as boolean })}
          />
          <label htmlFor="has_wave_starts" className="cursor-pointer">
            La carrera tiene cajones de salida organizados por marcas/tiempos
          </label>
        </div>
      </div>

      {/* Ubicación de Salida */}
      <div>
        <Label htmlFor="start_location">Ubicación Exacta de Salida</Label>
        <Input
          id="start_location"
          placeholder="ej: Plaza Mayor, Cangas de Onís"
          value={formData.start_location || ''}
          onChange={(e) => onUpdate({ start_location: e.target.value })}
          className="mt-1"
        />
      </div>
    </div>
  );
};


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Mountain, Route, Timer } from "lucide-react";
import { RaceFormData, RaceModality, TerrainProfile, RaceDistance } from "@/types/race";

interface TechnicalStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const TechnicalStep = ({ formData, onUpdate, onNext, onPrev }: TechnicalStepProps) => {
  const modalityOptions: { value: RaceModality; label: string; icon: any }[] = [
    { value: 'road', label: 'Ruta/Asfalto', icon: Route },
    { value: 'trail', label: 'Trail/Montaña', icon: Mountain },
  ];

  const terrainOptions: { value: TerrainProfile; label: string }[] = [
    { value: 'hilly', label: 'Con desnivel' },
    { value: 'flat', label: 'Llano' },
  ];

  const distanceOptions: { value: RaceDistance; label: string; description: string }[] = [
    { value: 'ultra', label: 'Ultra', description: '50K+' },
    { value: 'marathon', label: 'Maratón', description: '42.195K' },
    { value: 'half_marathon', label: 'Media Maratón', description: '21.1K' },
    { value: '20k', label: '20K', description: '20 kilómetros' },
    { value: '15k', label: '15K', description: '15 kilómetros' },
    { value: '10k', label: '10K', description: '10 kilómetros' },
    { value: '5k', label: '5K', description: '5 kilómetros' },
  ];

  const handleModalityChange = (modality: RaceModality, checked: boolean) => {
    const currentModalities = formData.modalities || [];
    const newModalities = checked
      ? [...currentModalities, modality]
      : currentModalities.filter(m => m !== modality);
    onUpdate({ modalities: newModalities });
  };

  const handleTerrainChange = (terrain: TerrainProfile, checked: boolean) => {
    const currentTerrain = formData.terrain_profile || [];
    const newTerrain = checked
      ? [...currentTerrain, terrain]
      : currentTerrain.filter(t => t !== terrain);
    onUpdate({ terrain_profile: newTerrain });
  };

  const handleDistanceChange = (distance: RaceDistance, checked: boolean) => {
    const currentDistances = formData.distances || [];
    const newDistances = checked
      ? [...currentDistances, distance]
      : currentDistances.filter(d => d !== distance);
    onUpdate({ distances: newDistances });
  };

  const canProceed = () => {
    return (formData.modalities && formData.modalities.length > 0) &&
           (formData.terrain_profile && formData.terrain_profile.length > 0) &&
           (formData.distances && formData.distances.length > 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Características Técnicas</h2>
        <p className="text-gray-600 mt-2">Define el tipo y características de la carrera</p>
      </div>

      {/* Modalidad de Carrera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>Modalidad de Carrera</span>
          </CardTitle>
          <CardDescription>Selecciona uno o más tipos de carrera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modalityOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={`modality-${option.value}`}
                    checked={formData.modalities?.includes(option.value) || false}
                    onCheckedChange={(checked) => handleModalityChange(option.value, checked as boolean)}
                  />
                  <IconComponent className="w-5 h-5 text-blue-600" />
                  <Label htmlFor={`modality-${option.value}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Perfil del Terreno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mountain className="w-5 h-5" />
            <span>Perfil del Recorrido</span>
          </CardTitle>
          <CardDescription>Describe la topografía del recorrido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {terrainOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`terrain-${option.value}`}
                  checked={formData.terrain_profile?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleTerrainChange(option.value, checked as boolean)}
                />
                <Label htmlFor={`terrain-${option.value}`} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distancias Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Timer className="w-5 h-5" />
            <span>Distancias de la Carrera</span>
          </CardTitle>
          <CardDescription>Selecciona las distancias disponibles en esta carrera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {distanceOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`distance-${option.value}`}
                  checked={formData.distances?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleDistanceChange(option.value, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={`distance-${option.value}`} className="cursor-pointer font-medium">
                    {option.label}
                  </Label>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ubicación de Salida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Ubicación de Salida</span>
          </CardTitle>
          <CardDescription>Especifica dónde comienza la carrera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="start_location">Ubicación exacta de salida</Label>
              <input
                id="start_location"
                type="text"
                value={formData.start_location || ''}
                onChange={(e) => onUpdate({ start_location: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Plaza Mayor, Centro Ciudad"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="has_wave_starts"
                checked={formData.has_wave_starts || false}
                onCheckedChange={(checked) => onUpdate({ has_wave_starts: checked as boolean })}
              />
              <Label htmlFor="has_wave_starts" className="cursor-pointer">
                La carrera tiene cajones de salida según marcas
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default TechnicalStep;

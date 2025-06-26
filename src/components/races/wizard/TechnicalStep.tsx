
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Mountain, Route, Timer, MapPin } from "lucide-react";
import { RaceFormData, RaceModality, TerrainProfile, RaceDistance } from "@/types/race";

interface TechnicalStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

const MODALITIES = [
  { id: 'road' as RaceModality, label: 'Ruta/Asfalto', icon: Route, description: 'Carreras en asfalto, carreteras o senderos pavimentados' },
  { id: 'trail' as RaceModality, label: 'Trail/Montaña', icon: Mountain, description: 'Carreras en senderos naturales, montaña o campo' }
];

const TERRAIN_PROFILES = [
  { id: 'flat' as TerrainProfile, label: 'Llano', description: 'Terreno mayormente plano con poco desnivel' },
  { id: 'hilly' as TerrainProfile, label: 'Montañoso', description: 'Terreno con subidas y bajadas significativas' }
];

const DISTANCES = [
  { id: '5k' as RaceDistance, label: '5K', description: '5 kilómetros' },
  { id: '10k' as RaceDistance, label: '10K', description: '10 kilómetros' },
  { id: '15k' as RaceDistance, label: '15K', description: '15 kilómetros' },
  { id: '20k' as RaceDistance, label: '20K', description: '20 kilómetros' },
  { id: 'half_marathon' as RaceDistance, label: 'Media Maratón', description: '21.1 kilómetros' },
  { id: 'marathon' as RaceDistance, label: 'Maratón', description: '42.2 kilómetros' },
  { id: 'ultra' as RaceDistance, label: 'Ultra', description: 'Más de 42.2 kilómetros' }
];

const TechnicalStep = ({ formData, onUpdate }: TechnicalStepProps) => {
  const handleModalityChange = (modalityId: RaceModality, checked: boolean) => {
    const currentModalities = formData.modalities || [];
    if (checked) {
      onUpdate({ modalities: [...currentModalities, modalityId] });
    } else {
      onUpdate({ modalities: currentModalities.filter(m => m !== modalityId) });
    }
  };

  const handleTerrainChange = (terrainId: TerrainProfile, checked: boolean) => {
    const currentTerrain = formData.terrain_profile || [];
    if (checked) {
      onUpdate({ terrain_profile: [...currentTerrain, terrainId] });
    } else {
      onUpdate({ terrain_profile: currentTerrain.filter(t => t !== terrainId) });
    }
  };

  const handleDistanceChange = (distanceId: RaceDistance, checked: boolean) => {
    const currentDistances = formData.distances || [];
    if (checked) {
      onUpdate({ distances: [...currentDistances, distanceId] });
    } else {
      onUpdate({ distances: currentDistances.filter(d => d !== distanceId) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Características Técnicas</h2>
        <p className="text-gray-600 mt-2">Define las características técnicas de tu carrera</p>
      </div>

      {/* Modalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>Modalidades Disponibles</span>
          </CardTitle>
          <CardDescription>Selecciona el tipo de carrera que ofreces</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MODALITIES.map((modality) => {
            const IconComponent = modality.icon;
            const isChecked = formData.modalities?.includes(modality.id) || false;
            
            return (
              <div key={modality.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={modality.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleModalityChange(modality.id, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <Label htmlFor={modality.id} className="font-medium cursor-pointer">
                      {modality.label}
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{modality.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Perfil del Terreno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mountain className="w-5 h-5" />
            <span>Perfil del Terreno</span>
          </CardTitle>
          <CardDescription>Describe el tipo de terreno de la carrera</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {TERRAIN_PROFILES.map((terrain) => {
            const isChecked = formData.terrain_profile?.includes(terrain.id) || false;
            
            return (
              <div key={terrain.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={terrain.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleTerrainChange(terrain.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={terrain.id} className="font-medium cursor-pointer">
                    {terrain.label}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">{terrain.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Distancias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Timer className="w-5 h-5" />
            <span>Distancias Disponibles</span>
          </CardTitle>
          <CardDescription>Selecciona las distancias que incluye tu carrera</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DISTANCES.map((distance) => {
              const isChecked = formData.distances?.includes(distance.id) || false;
              
              return (
                <div key={distance.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={distance.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleDistanceChange(distance.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={distance.id} className="font-medium cursor-pointer">
                      {distance.label}
                    </Label>
                    <p className="text-xs text-gray-500">{distance.description}</p>
                  </div>
                </div>
              );
            })}
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
          <div>
            <Label htmlFor="start_location">Ubicación exacta de salida</Label>
            <input
              id="start_location"
              type="text"
              value={formData.start_location || ''}
              onChange={(e) => onUpdate({ start_location: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Paseo Recoletos"
            />
          </div>
          
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="has_wave_starts"
              checked={formData.has_wave_starts || false}
              onCheckedChange={(checked) => onUpdate({ has_wave_starts: checked as boolean })}
            />
            <Label htmlFor="has_wave_starts" className="text-sm">
              La carrera tiene cajones de salida según marcas
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalStep;

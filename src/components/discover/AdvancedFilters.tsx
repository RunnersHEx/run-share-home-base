
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { X, MapPin, Calendar, Trophy, Users } from "lucide-react";
import { RaceFilters } from "@/types/race";

interface AdvancedFiltersProps {
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
  onClose?: () => void;
  onSearch?: () => void;
}

export const AdvancedFilters = ({ filters, onFiltersChange, onClose, onSearch }: AdvancedFiltersProps) => {
  const [pointsRange, setPointsRange] = useState([0, 500]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
  const [selectedTerrainProfiles, setSelectedTerrainProfiles] = useState<string[]>([]);
  const [maxGuests, setMaxGuests] = useState<number>(1);

  const handleModalityChange = (modality: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedModalities, modality]
      : selectedModalities.filter(m => m !== modality);
    setSelectedModalities(updated);
  };

  const handleDistanceChange = (distance: string, checked: boolean) => {
    const updated = checked
      ? [...selectedDistances, distance] 
      : selectedDistances.filter(d => d !== distance);
    setSelectedDistances(updated);
  };

  const handleTerrainChange = (terrain: string, checked: boolean) => {
    const updated = checked
      ? [...selectedTerrainProfiles, terrain]
      : selectedTerrainProfiles.filter(t => t !== terrain);
    setSelectedTerrainProfiles(updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setPointsRange([0, 500]);
    setSelectedModalities([]);
    setSelectedDistances([]);
    setSelectedTerrainProfiles([]);
    setMaxGuests(1);
  };

  const handleSearch = () => {
    // Apply all current filter states to the filters
    const newFilters = {
      ...filters,
      pointsRange,
      modalities: selectedModalities.length > 0 ? selectedModalities : undefined,
      distances: selectedDistances.length > 0 ? selectedDistances : undefined,
      terrainProfiles: selectedTerrainProfiles.length > 0 ? selectedTerrainProfiles : undefined,
      maxGuests: maxGuests > 1 ? maxGuests : undefined
    };
    
    onFiltersChange(newFilters);
    
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Filtros Avanzados</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ubicación y Fechas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="font-semibold">Ubicación y Fechas</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input 
                id="province"
                placeholder="Buscar provincia..." 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="radius">Radio de búsqueda</Label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md">
                <option>Cualquier distancia</option>
                <option>25 km</option>
                <option>50 km</option>
                <option>100 km</option>
                <option>200 km</option>
                <option>500 km</option>
                <option>+500 km</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="dateRange">Rango de fechas</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input type="date" placeholder="Desde" />
                <Input type="date" placeholder="Hasta" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Características de Carrera */}
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
                    onCheckedChange={(checked) => handleModalityChange('road', checked as boolean)}
                  />
                  <Label htmlFor="road" className="text-sm">Ruta/Asfalto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="trail"
                    checked={selectedModalities.includes('trail')}
                    onCheckedChange={(checked) => handleModalityChange('trail', checked as boolean)}
                  />
                  <Label htmlFor="trail" className="text-sm">Trail/Montaña</Label>
                </div>
              </div>
            </div>

            {/* Perfil del recorrido */}
            <div>
              <Label className="text-sm font-medium">Perfil del recorrido</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hilly"
                    checked={selectedTerrainProfiles.includes('hilly')}
                    onCheckedChange={(checked) => handleTerrainChange('hilly', checked as boolean)}
                  />
                  <Label htmlFor="hilly" className="text-sm">Con desnivel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="flat"
                    checked={selectedTerrainProfiles.includes('flat')}
                    onCheckedChange={(checked) => handleTerrainChange('flat', checked as boolean)}
                  />
                  <Label htmlFor="flat" className="text-sm">Llano</Label>
                </div>
              </div>
            </div>

            {/* Distancias */}
            <div>
              <Label className="text-sm font-medium">Distancia/s carrera</Label>
              <div className="mt-2 space-y-2">
                {[
                  { id: 'ultra', label: 'Ultra' },
                  { id: 'marathon', label: 'Maratón' },
                  { id: 'half_marathon', label: 'Media Maratón' },
                  { id: '20k', label: '20K' },
                  { id: '15k', label: '15K' },
                  { id: '10k', label: '10K' },
                  { id: '5k', label: '5K' }
                ].map((distance) => (
                  <div key={distance.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={distance.id}
                      checked={selectedDistances.includes(distance.id)}
                      onCheckedChange={(checked) => handleDistanceChange(distance.id, checked as boolean)}
                    />
                    <Label htmlFor={distance.id} className="text-sm">{distance.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cajones de salida */}
            <div>
              <Label className="text-sm font-medium">Cajones de salida según marcas</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="wave-yes" />
                  <Label htmlFor="wave-yes" className="text-sm">Sí</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="wave-no" />
                  <Label htmlFor="wave-no" className="text-sm">No</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Alojamiento y Experiencia */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="font-semibold">Alojamiento y Experiencia</h3>
          </div>
          
          <div className="space-y-4">
            {/* Rango de puntos */}
            <div>
              <Label className="text-sm font-medium">
                Puntos que quiero gastar: {pointsRange[0]} - {pointsRange[1]}
              </Label>
              <Slider
                value={pointsRange}
                onValueChange={setPointsRange}
                max={500}
                min={0}
                step={25}
                className="mt-2"
              />
            </div>

            {/* Número máximo de huéspedes */}
            <div>
              <Label className="text-sm font-medium">Número máximo huéspedes</Label>
              <select 
                value={maxGuests}
                onChange={(e) => setMaxGuests(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value={1}>1 huésped</option>
                <option value={2}>2 huéspedes</option>
                <option value={3}>3 huéspedes</option>
                <option value={4}>4 huéspedes</option>
                <option value={5}>5 huéspedes</option>
                <option value={6}>6+ huéspedes</option>
              </select>
            </div>

            {/* Rating mínimo */}
            <div>
              <Label className="text-sm font-medium">Rating mínimo del host</Label>
              <select className="w-full mt-1 px-3 py-2 border rounded-md">
                <option>Cualquier rating</option>
                <option>4.0+ estrellas</option>
                <option>4.5+ estrellas</option>
                <option>4.8+ estrellas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleSearch}
            className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90"
          >
            Buscar Carreras
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearAllFilters}
            className="w-full"
          >
            Limpiar todos los filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

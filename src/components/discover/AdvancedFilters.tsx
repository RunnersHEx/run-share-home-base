
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, MapPin, Calendar, Trophy, Users } from "lucide-react";
import { RaceFilters, RaceModality, RaceDistance, TerrainProfile } from "@/types/race";

interface AdvancedFiltersProps {
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
  onClose?: () => void;
  onSearch?: () => void;
}

const spanishProvinces = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca",
  "Jaén", "León", "Lleida", "La Rioja", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
  "Ourense", "Palencia", "Las Palmas", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza"
];

const months = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

export const AdvancedFilters = ({ filters, onFiltersChange, onClose, onSearch }: AdvancedFiltersProps) => {
  const [pointsRange, setPointsRange] = useState<[number, number]>([0, 500]);
  const [selectedModalities, setSelectedModalities] = useState<RaceModality[]>(filters.modalities || []);
  const [selectedDistances, setSelectedDistances] = useState<RaceDistance[]>(filters.distances || []);
  const [selectedTerrainProfiles, setSelectedTerrainProfiles] = useState<TerrainProfile[]>(filters.terrainProfiles || []);
  const [maxGuests, setMaxGuests] = useState<number>(filters.maxGuests || 1);
  const [selectedProvince, setSelectedProvince] = useState<string>(filters.province || "");
  const [selectedMonth, setSelectedMonth] = useState<string>(filters.month || "");

  const handleModalityChange = (modality: RaceModality, checked: boolean) => {
    const updated = checked 
      ? [...selectedModalities, modality]
      : selectedModalities.filter(m => m !== modality);
    setSelectedModalities(updated);
    console.log('Modalities updated:', updated);
  };

  const handleDistanceChange = (distance: RaceDistance, checked: boolean) => {
    const updated = checked
      ? [...selectedDistances, distance] 
      : selectedDistances.filter(d => d !== distance);
    setSelectedDistances(updated);
    console.log('Distances updated:', updated);
  };

  const handleTerrainChange = (terrain: TerrainProfile, checked: boolean) => {
    const updated = checked
      ? [...selectedTerrainProfiles, terrain]
      : selectedTerrainProfiles.filter(t => t !== terrain);
    setSelectedTerrainProfiles(updated);
    console.log('Terrain profiles updated:', updated);
  };

  const clearAllFilters = () => {
    console.log('Clearing all filters');
    onFiltersChange({});
    setPointsRange([0, 500]);
    setSelectedModalities([]);
    setSelectedDistances([]);
    setSelectedTerrainProfiles([]);
    setMaxGuests(1);
    setSelectedProvince("");
    setSelectedMonth("");
  };

  const handleSearch = () => {
    // Apply all current filter states to the filters with proper type casting
    const newFilters: RaceFilters = {
      ...filters,
      pointsRange: pointsRange,
      modalities: selectedModalities.length > 0 ? selectedModalities : undefined,
      distances: selectedDistances.length > 0 ? selectedDistances : undefined,
      terrainProfiles: selectedTerrainProfiles.length > 0 ? selectedTerrainProfiles : undefined,
      maxGuests: maxGuests > 1 ? maxGuests : undefined,
      province: selectedProvince || undefined,
      month: selectedMonth || undefined
    };
    
    console.log('Search triggered with filters:', newFilters);
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
              <Select 
                value={selectedProvince} 
                onValueChange={(value) => {
                  console.log('Province selected:', value);
                  setSelectedProvince(value);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar provincia..." />
                </SelectTrigger>
                <SelectContent>
                  {spanishProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="radius">Radio de búsqueda</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Cualquier distancia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquier distancia</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="200">200 km</SelectItem>
                  <SelectItem value="500">500 km</SelectItem>
                  <SelectItem value="500+">+500 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="month">Mes</Label>
              <Select 
                value={selectedMonth} 
                onValueChange={(value) => { 
                  console.log('Month selected:', value);
                  setSelectedMonth(value);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar mes..." />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  { id: 'ultra' as RaceDistance, label: 'Ultra' },
                  { id: 'marathon' as RaceDistance, label: 'Maratón' },
                  { id: 'half_marathon' as RaceDistance, label: 'Media Maratón' },
                  { id: '20k' as RaceDistance, label: '20K' },
                  { id: '15k' as RaceDistance, label: '15K' },
                  { id: '10k' as RaceDistance, label: '10K' },
                  { id: '5k' as RaceDistance, label: '5K' }
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
                onValueChange={(value) => setPointsRange([value[0], value[1]])}
                max={500}
                min={0}
                step={25}
                className="mt-2"
              />
            </div>

            {/* Número máximo de huéspedes */}
            <div>
              <Label className="text-sm font-medium">Número máximo huéspedes</Label>
              <Select value={maxGuests.toString()} onValueChange={(value) => setMaxGuests(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 huésped</SelectItem>
                  <SelectItem value="2">2 huéspedes</SelectItem>
                  <SelectItem value="3">3 huéspedes</SelectItem>
                  <SelectItem value="4">4 huéspedes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating mínimo */}
            <div>
              <Label className="text-sm font-medium">Rating mínimo del host</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Cualquier rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquier rating</SelectItem>
                  <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                  <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                  <SelectItem value="4.8">4.8+ estrellas</SelectItem>
                </SelectContent>
              </Select>
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

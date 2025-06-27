
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { RaceFilters, RaceModality, RaceDistance, TerrainProfile } from "@/types/race";
import { LocationFilters } from "./LocationFilters";
import { RaceCharacteristicsFilters } from "./RaceCharacteristicsFilters";
import { AccommodationFilters } from "./AccommodationFilters";

interface AdvancedFiltersProps {
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
  onClose?: () => void;
  onSearch?: () => void;
}

export const AdvancedFilters = ({ filters, onFiltersChange, onClose, onSearch }: AdvancedFiltersProps) => {
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
    setSelectedModalities([]);
    setSelectedDistances([]);
    setSelectedTerrainProfiles([]);
    setMaxGuests(1);
    setSelectedProvince("");
    setSelectedMonth("");
  };

  const handleSearch = () => {
    const newFilters: RaceFilters = {
      ...filters,
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
        <LocationFilters
          selectedProvince={selectedProvince}
          onProvinceChange={setSelectedProvince}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        <Separator />

        <RaceCharacteristicsFilters
          selectedModalities={selectedModalities}
          onModalityChange={handleModalityChange}
          selectedDistances={selectedDistances}
          onDistanceChange={handleDistanceChange}
          selectedTerrainProfiles={selectedTerrainProfiles}
          onTerrainChange={handleTerrainChange}
        />

        <Separator />

        <AccommodationFilters
          maxGuests={maxGuests}
          onMaxGuestsChange={setMaxGuests}
        />

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

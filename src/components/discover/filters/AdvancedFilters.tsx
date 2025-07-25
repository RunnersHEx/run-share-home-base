
import { useState, useEffect } from "react";
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
  const [selectedRadius, setSelectedRadius] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("");

  // Sync local state with filters prop when it changes
  useEffect(() => {
    setSelectedModalities(filters.modalities || []);
    setSelectedDistances(filters.distances || []);
    setSelectedTerrainProfiles(filters.terrainProfiles || []);
    setMaxGuests(filters.maxGuests || 1);
    setSelectedProvince(filters.province || "");
    setSelectedMonth(filters.month || "");
    // Note: radius and rating are not part of filters yet
  }, [filters]);

  // Auto-apply filters when any filter changes
  const applyFilters = (newFilters: Partial<RaceFilters>) => {
    const updatedFilters: RaceFilters = {
      ...filters,
      ...newFilters
    };
    
    console.log('Auto-applying filters:', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleModalityChange = (modality: RaceModality, checked: boolean) => {
    const updated = checked 
      ? [...selectedModalities, modality]
      : selectedModalities.filter(m => m !== modality);
    setSelectedModalities(updated);
    console.log('Modalities updated:', updated);
    
    // Auto-apply filter
    applyFilters({
      modalities: updated.length > 0 ? updated : undefined
    });
  };

  const handleDistanceChange = (distance: RaceDistance, checked: boolean) => {
    const updated = checked
      ? [...selectedDistances, distance] 
      : selectedDistances.filter(d => d !== distance);
    setSelectedDistances(updated);
    console.log('Distances updated:', updated);
    
    // Auto-apply filter
    applyFilters({
      distances: updated.length > 0 ? updated : undefined
    });
  };

  const handleTerrainChange = (terrain: TerrainProfile, checked: boolean) => {
    const updated = checked
      ? [...selectedTerrainProfiles, terrain]
      : selectedTerrainProfiles.filter(t => t !== terrain);
    setSelectedTerrainProfiles(updated);
    console.log('Terrain profiles updated:', updated);
    
    // Auto-apply filter
    applyFilters({
      terrainProfiles: updated.length > 0 ? updated : undefined
    });
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    console.log('Province updated:', province);
    
    // Auto-apply filter
    applyFilters({
      province: province || undefined
    });
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    console.log('Month updated:', month);
    
    // Auto-apply filter
    applyFilters({
      month: month || undefined
    });
  };

  const handleMaxGuestsChange = (guests: number) => {
    setMaxGuests(guests);
    console.log('Max guests updated:', guests);
    
    // Auto-apply filter
    applyFilters({
      maxGuests: guests > 1 ? guests : undefined
    });
  };

  const handleRadiusChange = (radius: string) => {
    setSelectedRadius(radius);
    console.log('Radius updated:', radius);
    // Note: radius is not part of RaceFilters interface yet, so we skip auto-apply for now
  };

  const handleRatingChange = (rating: string) => {
    setSelectedRating(rating);
    console.log('Rating updated:', rating);
    // Note: rating is not part of RaceFilters interface yet, so we skip auto-apply for now
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
    setSelectedRadius("");
    setSelectedRating("");
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
          onProvinceChange={handleProvinceChange}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          selectedRadius={selectedRadius}
          onRadiusChange={handleRadiusChange}
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
          onMaxGuestsChange={handleMaxGuestsChange}
          selectedRating={selectedRating}
          onRatingChange={handleRatingChange}
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

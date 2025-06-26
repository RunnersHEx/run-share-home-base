
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Grid3X3, Map as MapIcon, X } from "lucide-react";
import { RaceFilters } from "@/types/race";

interface HeroSearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
  viewMode: "grid" | "map";
  onViewModeChange: (mode: "grid" | "map") => void;
}

export const HeroSearchSection = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange
}: HeroSearchSectionProps) => {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const clearFilter = (filterKey: keyof RaceFilters) => {
    onFiltersChange({ ...filters, [filterKey]: undefined });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  // Helper function to handle modality changes
  const handleModalityChange = (value: string) => {
    if (!value) {
      const { modalities, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, modalities: [value as any] });
    }
  };

  // Helper function to handle distance changes
  const handleDistanceChange = (value: string) => {
    if (!value) {
      const { distances, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, distances: [value as any] });
    }
  };

  // Helper function to get current modality value
  const getCurrentModality = () => {
    return filters.modalities && filters.modalities.length > 0 ? filters.modalities[0] : '';
  };

  // Helper function to get current distance value
  const getCurrentDistance = () => {
    return filters.distances && filters.distances.length > 0 ? filters.distances[0] : '';
  };

  return (
    <div className="bg-gradient-to-br from-[#1E40AF] to-[#059669] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Descubre Carreras Únicas
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Encuentra experiencias auténticas con runners locales en destinos increíbles
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por carrera, ciudad o provincia..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 h-12 text-lg border-0 focus:ring-2 focus:ring-[#1E40AF]"
                  onFocus={() => setFocusedInput('search')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap lg:flex-nowrap gap-3">
                <Select
                  value={filters.month || ''}
                  onValueChange={(value) => onFiltersChange({ ...filters, month: value || undefined })}
                >
                  <SelectTrigger className="w-40 h-12 border-0">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={getCurrentModality()}
                  onValueChange={handleModalityChange}
                >
                  <SelectTrigger className="w-44 h-12 border-0">
                    <SelectValue placeholder="Modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">Ruta/Asfalto</SelectItem>
                    <SelectItem value="trail">Trail/Montaña</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={getCurrentDistance()}
                  onValueChange={handleDistanceChange}
                >
                  <SelectTrigger className="w-44 h-12 border-0">
                    <SelectValue placeholder="Distancia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultra">Ultra</SelectItem>
                    <SelectItem value="marathon">Maratón</SelectItem>
                    <SelectItem value="half_marathon">Media Maratón</SelectItem>
                    <SelectItem value="20k">20K</SelectItem>
                    <SelectItem value="15k">15K</SelectItem>
                    <SelectItem value="10k">10K</SelectItem>
                    <SelectItem value="5k">5K</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("grid")}
                    className="h-12 px-4 rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("map")}
                    className="h-12 px-4 rounded-l-none"
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <span className="text-blue-100 text-sm font-medium">Filtros activos:</span>
              
              {filters.month && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Mes: {new Date(2024, parseInt(filters.month) - 1).toLocaleDateString('es-ES', { month: 'long' })}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => clearFilter('month')}
                  />
                </Badge>
              )}
              
              {filters.modalities && filters.modalities.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filters.modalities[0] === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => clearFilter('modalities')}
                  />
                </Badge>
              )}
              
              {filters.distances && filters.distances.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filters.distances[0].replace('_', ' ').toUpperCase()}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => clearFilter('distances')}
                  />
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({})}
                className="text-blue-100 hover:text-white hover:bg-blue-700 h-auto p-1"
              >
                Limpiar todos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

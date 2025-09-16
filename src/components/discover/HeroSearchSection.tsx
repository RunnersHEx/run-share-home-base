
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, X } from "lucide-react";
import { RaceFilters } from "@/types/race";
import { CustomSelect } from "@/components/ui/custom";

interface HeroSearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
}

export const HeroSearchSection = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange
}: HeroSearchSectionProps) => {
  const spanishProvinces = [
    "Outside Spain", // Option to search for international races
    "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
    "Illes Balears", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
    "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
    "Jaén", "León", "Lleida", "La Rioja", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
    "Ourense", "Palencia", "Las Palmas", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
    "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
    "Vizcaya", "Zamora", "Zaragoza"
  ];

  const provinceOptions = spanishProvinces.map(province => ({
    value: province,
    label: province
  }));

  const monthOptions = [
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

  const modalityOptions = [
    { value: "road", label: "Ruta/Asfalto" },
    { value: "trail", label: "Trail/Montaña" }
  ];

  const distanceOptions = [
    { value: "ultra", label: "Ultra" },
    { value: "marathon", label: "Maratón" },
    { value: "half_marathon", label: "Media Maratón" },
    { value: "20k", label: "20K" },
    { value: "15k", label: "15K" },
    { value: "10k", label: "10K" },
    { value: "5k", label: "5K" }
  ];
  const clearFilter = (filterKey: keyof RaceFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof RaceFilters];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== '';
  });

  // Helper function to handle modality changes
  const handleModalityChange = (value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters.modalities = [value as any];
    } else {
      delete newFilters.modalities;
    }
    onFiltersChange(newFilters);
  };

  // Helper function to handle distance changes
  const handleDistanceChange = (value: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters.distances = [value as any];
    } else {
      delete newFilters.distances;
    }
    onFiltersChange(newFilters);
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
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6">
            {/* Main Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por carrera, ciudad o provincia..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-12 text-lg border-0 focus:ring-2 focus:ring-[#1E40AF] text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 flex-1">
                <CustomSelect
                  value={filters.province || ''}
                  onValueChange={(value) => {
                    const newFilters = { ...filters };
                    if (value) {
                      newFilters.province = value;
                    } else {
                      delete newFilters.province;
                    }
                    onFiltersChange(newFilters);
                  }}
                  options={provinceOptions}
                  placeholder="Destino"
                  className="w-full sm:w-40"
                />

                <CustomSelect
                  value={filters.month || ''}
                  onValueChange={(value) => {
                    const newFilters = { ...filters };
                    if (value) {
                      newFilters.month = value;
                    } else {
                      delete newFilters.month;
                    }
                    onFiltersChange(newFilters);
                  }}
                  options={monthOptions}
                  placeholder="Mes"
                  className="w-full sm:w-36"
                />

                <CustomSelect
                  value={getCurrentModality()}
                  onValueChange={(value) => {
                    handleModalityChange(value);
                  }}
                  options={modalityOptions}
                  placeholder="Modalidad"
                  className="w-full sm:w-40"
                />

                <CustomSelect
                  value={getCurrentDistance()}
                  onValueChange={(value) => {
                    handleDistanceChange(value);
                  }}
                  options={distanceOptions}
                  placeholder="Distancia"
                  className="w-full sm:w-40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <span className="text-blue-100 text-sm font-medium">Filtros activos:</span>
              
              {filters.province && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Destino: {filters.province}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => clearFilter('province')}
                  />
                </Badge>
              )}
              
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

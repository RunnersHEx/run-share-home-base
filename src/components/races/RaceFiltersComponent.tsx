
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RaceFilters } from "@/types/race";

interface RaceFiltersComponentProps {
  filters: RaceFilters;
  onFiltersChange: (filters: RaceFilters) => void;
}

export const RaceFiltersComponent = ({ filters, onFiltersChange }: RaceFiltersComponentProps) => {
  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>

      <Select
        value={filters.month || ''}
        onValueChange={(value) => onFiltersChange({ ...filters, month: value || undefined })}
      >
        <SelectTrigger className="w-48">
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
        value={filters.modality || ''}
        onValueChange={(value) => onFiltersChange({ ...filters, modality: value as any || undefined })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Modalidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="road">Ruta/Asfalto</SelectItem>
          <SelectItem value="trail">Trail/Montaña</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.distance || ''}
        onValueChange={(value) => onFiltersChange({ ...filters, distance: value as any || undefined })}
      >
        <SelectTrigger className="w-48">
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

      <Select
        value={filters.status || ''}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as any || undefined })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Activa</SelectItem>
          <SelectItem value="inactive">Inactiva</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="ml-auto"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
};

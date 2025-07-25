
import { Button } from "@/components/ui/button";
import { Filter, Grid3X3, Map as MapIcon } from "lucide-react";

interface ResultsHeaderProps {
  resultsCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: "grid" | "map";
  onViewModeChange: (mode: "grid" | "map") => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const ResultsHeader = ({
  resultsCount,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange
}: ResultsHeaderProps) => {
  console.log('📊 RESULTS HEADER - Received count:', resultsCount, 'Type:', typeof resultsCount);
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {resultsCount} races found
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="lg:hidden"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("map")}
            className="px-3"
          >
            <MapIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Sort Dropdown */}
        <select 
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        >
          <option value="relevance">Más relevante</option>
          <option value="date">Fecha más próxima</option>
          <option value="points">Menor costo puntos</option>
          <option value="rating">Mejor valorado</option>
        </select>
      </div>
    </div>
  );
};

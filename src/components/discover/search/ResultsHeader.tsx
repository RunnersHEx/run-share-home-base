
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface ResultsHeaderProps {
  resultsCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const ResultsHeader = ({
  resultsCount,
  showFilters,
  onToggleFilters,
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

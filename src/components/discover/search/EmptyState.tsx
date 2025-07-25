
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface EmptyStateProps {
  onClearFilters: () => void;
}

export const EmptyState = ({ onClearFilters }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No races found
      </h3>
      <p className="text-gray-600 mb-6">
        Try adjusting your search filters to find more options.
      </p>
      <Button 
        onClick={onClearFilters}
        variant="outline"
      >
        Clean filters
      </Button>
    </div>
  );
};

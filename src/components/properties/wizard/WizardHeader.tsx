
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface WizardHeaderProps {
  isEditing: boolean;
  currentStepDescription: string;
  onClose: () => void;
}

const WizardHeader = ({ isEditing, currentStepDescription, onClose }: WizardHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar Propiedad" : "Agregar Propiedad"}
        </h2>
        <p className="text-gray-600 mt-1">
          {currentStepDescription}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WizardHeader;

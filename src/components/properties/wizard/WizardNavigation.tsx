
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardNavigationProps {
  currentStep: number;
  steps: Step[];
  canProceed: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
}

const WizardNavigation = ({ 
  currentStep, 
  steps, 
  canProceed, 
  isSubmitting, 
  isEditing, 
  onPrevStep, 
  onNextStep, 
  onSubmit 
}: WizardNavigationProps) => {
  return (
    <div className="flex items-center justify-between p-6 border-t flex-shrink-0">
      <Button
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Anterior
      </Button>

      <div className="text-sm text-gray-600">
        {steps[currentStep - 1].title}
      </div>

      {currentStep === steps.length ? (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-runner-blue-600 hover:bg-runner-blue-700"
        >
          {isSubmitting ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Actualizar Propiedad" : "Crear Propiedad")}
        </Button>
      ) : (
        <Button
          onClick={onNextStep}
          disabled={!canProceed}
          className="bg-runner-blue-600 hover:bg-runner-blue-700"
        >
          Siguiente
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default WizardNavigation;

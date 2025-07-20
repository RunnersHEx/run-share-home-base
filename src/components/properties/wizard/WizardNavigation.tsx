
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, memo } from "react";

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
  // Memoize button text to prevent unnecessary re-renders
  const submitButtonText = useMemo(() => {
    if (isSubmitting) {
      return isEditing ? "Actualizando..." : "Creando...";
    }
    return isEditing ? "Actualizar Propiedad" : "Crear Propiedad";
  }, [isSubmitting, isEditing]);

  const isLastStep = currentStep === steps.length;
  const currentStepTitle = steps && steps[currentStep - 1]?.title || "";
  
  // Defensive check to prevent rendering with invalid data
  if (!steps || steps.length === 0 || currentStep < 1 || currentStep > steps.length) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-6 border-t flex-shrink-0">
      <Button
        key="prev-button"
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Anterior
      </Button>

      <div className="text-sm text-gray-600">
        {currentStepTitle}
      </div>

      {isLastStep ? (
        <Button
          key="submit-button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-runner-blue-600 hover:bg-runner-blue-700"
        >
          {submitButtonText}
        </Button>
      ) : (
        <Button
          key="next-button"
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

export default memo(WizardNavigation);

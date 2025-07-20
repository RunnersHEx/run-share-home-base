
import { useState, useEffect, useCallback, useMemo } from "react";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./wizard/WizardProgress";
import WizardNavigation from "./wizard/WizardNavigation";
import WizardStepRenderer from "./wizard/WizardStepRenderer";
import WizardErrorBoundary from "./wizard/WizardErrorBoundary";
import { usePropertyWizardLogic } from "./wizard/usePropertyWizardLogic";
import { Property } from "@/types/property";

interface PropertyWizardProps {
  onClose: () => void;
  propertyId?: string;
  initialData?: Property;
}

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
  caption: string;
  isMain: boolean;
}

const STEPS = [
  { id: 1, title: "Información Básica", description: "Título y descripción de tu propiedad" },
  { id: 2, title: "Ubicación", description: "Dónde se encuentra tu propiedad" },
  { id: 3, title: "Servicios", description: "Comodidades que ofreces" },
  { id: 4, title: "Reglas y Configuración", description: "Reglas e instrucciones especiales" },
  { id: 5, title: "Fotos", description: "Imágenes de tu propiedad" }
];

const PropertyWizard = ({ onClose, propertyId, initialData }: PropertyWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  const {
    formData,
    updateFormData,
    isSubmitting,
    acknowledgedImportantNote,
    setAcknowledgedImportantNote,
    acceptedCancellationPolicy,
    setAcceptedCancellationPolicy,
    canProceed,
    handleSubmit
  } = usePropertyWizardLogic(propertyId, initialData, onClose);

  // Load existing images when editing
  useEffect(() => {
    if (initialData?.images) {
      const existingPhotos: PhotoPreview[] = initialData.images.map((img, index) => ({
        id: img.id,
        file: new File([], `existing-${img.id}`), // Placeholder file for existing images
        url: img.image_url,
        caption: img.caption || "",
        isMain: img.is_main
      }));
      setPhotos(existingPhotos);
    }
  }, [initialData]);

  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const onSubmit = useCallback(() => {
    handleSubmit(photos);
  }, [handleSubmit, photos]);

  const currentStepData = useMemo(() => STEPS[currentStep - 1], [currentStep]);

  // Defensive check to prevent rendering with invalid state
  if (currentStep < 1 || currentStep > STEPS.length) {
    console.error('PropertyWizard: Invalid current step', currentStep);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <WizardErrorBoundary onReset={() => setCurrentStep(1)}>
          <WizardHeader 
            isEditing={!!propertyId}
            currentStepDescription={currentStepData.description}
            onClose={onClose}
          />

          <WizardProgress 
            currentStep={currentStep}
            steps={STEPS}
            progress={progress}
          />

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <WizardStepRenderer
              key={`step-${currentStep}`}
              currentStep={currentStep}
              formData={formData}
              updateFormData={updateFormData}
              acknowledgedImportantNote={acknowledgedImportantNote}
              setAcknowledgedImportantNote={setAcknowledgedImportantNote}
              acceptedCancellationPolicy={acceptedCancellationPolicy}
              setAcceptedCancellationPolicy={setAcceptedCancellationPolicy}
              photos={photos}
              setPhotos={setPhotos}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          </div>

          <WizardNavigation
            currentStep={currentStep}
            steps={STEPS}
            canProceed={canProceed(currentStep)}
            isSubmitting={isSubmitting}
            isEditing={!!propertyId}
            onPrevStep={prevStep}
            onNextStep={nextStep}
            onSubmit={onSubmit}
          />
        </WizardErrorBoundary>
      </div>
    </div>
  );
};

export default PropertyWizard;

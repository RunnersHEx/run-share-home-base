
import BasicInfoStep from "./BasicInfoStep";
import LocationStep from "./LocationStep";
import AmenitiesStep from "./AmenitiesStep";
import RulesStep from "./RulesStep";
import PhotosStep from "./PhotosStep";
import { PropertyFormData } from "@/types/property";

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
  caption: string;
  isMain: boolean;
}

interface WizardStepRendererProps {
  currentStep: number;
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  acknowledgedImportantNote: boolean;
  setAcknowledgedImportantNote: (acknowledged: boolean) => void;
  acceptedCancellationPolicy: boolean;
  setAcceptedCancellationPolicy: (accepted: boolean) => void;
  photos: PhotoPreview[];
  setPhotos: (photos: PhotoPreview[]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const WizardStepRenderer = ({
  currentStep,
  formData,
  updateFormData,
  acknowledgedImportantNote,
  setAcknowledgedImportantNote,
  acceptedCancellationPolicy,
  setAcceptedCancellationPolicy,
  photos,
  setPhotos,
  nextStep,
  prevStep
}: WizardStepRendererProps) => {
  switch (currentStep) {
    case 1:
      return <BasicInfoStep formData={formData} updateFormData={updateFormData} />;
    case 2:
      return <LocationStep formData={formData} onUpdate={updateFormData} onNext={nextStep} onPrev={prevStep} />;
    case 3:
      return (
        <AmenitiesStep 
          formData={formData} 
          updateFormData={updateFormData}
          acknowledgedImportantNote={acknowledgedImportantNote}
          setAcknowledgedImportantNote={setAcknowledgedImportantNote}
        />
      );
    case 4:
      return (
        <RulesStep 
          formData={formData} 
          onUpdate={(data) => {
            updateFormData(data);
            // Check if cancellation policy was accepted
            if (data.cancellation_policy === "firm") {
              setAcceptedCancellationPolicy(true);
            }
          }} 
          onNext={nextStep} 
          onPrev={prevStep} 
        />
      );
    case 5:
      return <PhotosStep formData={formData} updateFormData={updateFormData} photos={photos} setPhotos={setPhotos} />;
    default:
      return null;
  }
};

export default WizardStepRenderer;

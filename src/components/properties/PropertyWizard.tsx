
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import BasicInfoStep from "./wizard/BasicInfoStep";
import LocationStep from "./wizard/LocationStep";
import AmenitiesStep from "./wizard/AmenitiesStep";
import RulesStep from "./wizard/RulesStep";
import PhotosStep from "./wizard/PhotosStep";
import { useProperties } from "@/hooks/useProperties";
import { toast } from "sonner";
import { PropertyFormData, Property } from "@/types/property";

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
  const { createProperty, updateProperty, uploadPropertyImage } = useProperties();
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    provinces: initialData?.provinces || [],
    locality: initialData?.locality || "",
    full_address: initialData?.full_address || "",
    bedrooms: initialData?.bedrooms || 1,
    beds: initialData?.beds || 1,
    bathrooms: initialData?.bathrooms || 1,
    max_guests: initialData?.max_guests || 2,
    amenities: initialData?.amenities || [],
    house_rules: initialData?.house_rules || "",
    check_in_instructions: initialData?.check_in_instructions || "",
    runner_instructions: initialData?.runner_instructions || "",
    cancellation_policy: initialData?.cancellation_policy || "flexible"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const progress = (currentStep / STEPS.length) * 100;

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let propertyResult;
      
      if (propertyId && initialData) {
        // Update existing property
        const success = await updateProperty(propertyId, formData);
        if (success) {
          propertyResult = { id: propertyId };
        }
      } else {
        // Create new property
        propertyResult = await createProperty({ ...formData, is_active: true });
      }

      if (propertyResult) {
        // Upload new photos (those with actual File objects)
        const newPhotos = photos.filter(photo => photo.file.size > 0);
        if (newPhotos.length > 0) {
          for (const photo of newPhotos) {
            await uploadPropertyImage(propertyResult.id, photo.file, photo.caption, photo.isMain);
          }
        }
        
        toast.success(propertyId ? "¡Propiedad actualizada exitosamente!" : "¡Propiedad creada exitosamente!");
        onClose();
      }
    } catch (error) {
      toast.error(propertyId ? "Error al actualizar la propiedad" : "Error al crear la propiedad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <AmenitiesStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <RulesStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <PhotosStep formData={formData} updateFormData={updateFormData} photos={photos} setPhotos={setPhotos} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== "" && formData.description.trim() !== "";
      case 2:
        return formData.provinces.length > 0 && formData.locality.trim() !== "" && formData.full_address.trim() !== "";
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {propertyId ? "Editar Propiedad" : "Agregar Propiedad"}
            </h2>
            <p className="text-gray-600 mt-1">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id 
                    ? "bg-runner-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`hidden md:block w-12 h-px mx-2 ${
                    currentStep > step.id ? "bg-runner-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {renderCurrentStep()}
        </div>

        <div className="flex items-center justify-between p-6 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="text-sm text-gray-600">
            {STEPS[currentStep - 1].title}
          </div>

          {currentStep === STEPS.length ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-runner-blue-600 hover:bg-runner-blue-700"
            >
              {isSubmitting ? (propertyId ? "Actualizando..." : "Creando...") : (propertyId ? "Actualizar Propiedad" : "Crear Propiedad")}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-runner-blue-600 hover:bg-runner-blue-700"
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyWizard;

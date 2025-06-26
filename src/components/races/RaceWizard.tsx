
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { BasicInfoStep } from "./wizard/BasicInfoStep";
import TechnicalStep from "./wizard/TechnicalStep";
import LogisticsStep from "./wizard/LogisticsStep";
import { ExperienceStep } from "./wizard/ExperienceStep";
import { PhotosStep } from "./wizard/PhotosStep";
import { RaceFormData } from "@/types/race";
import { useRaces } from "@/hooks/useRaces";
import { toast } from "sonner";

interface RaceWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: "Información Básica", component: BasicInfoStep },
  { id: 2, title: "Características Técnicas", component: TechnicalStep },
  { id: 3, title: "Logística y Costos", component: LogisticsStep },
  { id: 4, title: "Experiencia Local", component: ExperienceStep },
  { id: 5, title: "Fotos y Documentación", component: PhotosStep }
];

export const RaceWizard = ({ onClose, onSuccess }: RaceWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<RaceFormData>>({
    modalities: [],
    terrain_profile: [],
    distances: [],
    has_wave_starts: false,
    points_cost: 100, // Default points cost
    max_guests: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRace } = useRaces();

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting race data:', formData);
      
      // Validate required fields
      if (!formData.name || !formData.race_date || !formData.property_id) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      if (!formData.modalities || formData.modalities.length === 0) {
        toast.error('Por favor selecciona al menos una modalidad');
        return;
      }

      if (!formData.distances || formData.distances.length === 0) {
        toast.error('Por favor selecciona al menos una distancia');
        return;
      }

      const result = await createRace(formData as RaceFormData);
      if (result) {
        toast.success('¡Carrera creada exitosamente!');
        onSuccess();
      } else {
        toast.error('Error al crear la carrera. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error creating race:', error);
      toast.error('Error al crear la carrera. Verifica que todos los campos estén completos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (stepData: Partial<RaceFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.race_date && formData.property_id;
      case 2:
        return formData.modalities?.length && formData.distances?.length;
      case 3:
        return formData.points_cost !== undefined && formData.max_guests;
      case 4:
        return true; // Optional step
      case 5:
        return true; // Optional step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Crear Nueva Carrera</CardTitle>
                <p className="text-gray-600 mt-1">
                  Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <CurrentStepComponent
              formData={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onPrev={handlePrevious}
            />

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                
                {currentStep === STEPS.length ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid() || isSubmitting}
                    className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
                  >
                    {isSubmitting ? "Creando..." : "Crear Carrera"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
                  >
                    Siguiente
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

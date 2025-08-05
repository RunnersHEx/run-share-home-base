
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { BasicInfoStep } from "./wizard/BasicInfoStep";
import TechnicalStep from "./wizard/TechnicalStep";
import LogisticsStep from "./wizard/LogisticsStep";

import { PhotosStep } from "./wizard/PhotosStep";
import RaceWizardErrorBoundary from "./wizard/RaceWizardErrorBoundary";
import { RaceFormData } from "@/types/race";
import { useRaces } from "@/hooks/useRaces";
import { RaceService } from "@/services/raceService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
  caption: string;
  category: string;
  displayOrder: number;
  isExisting?: boolean; // Flag for existing images
}

interface RaceWizardProps {
  onClose: () => void;
  onSuccess: (updatedRaceData?: any) => void;
  editingRace?: any; // Race data for editing
  isEditMode?: boolean;
}

const STEPS = [
  { id: 1, title: "Información Básica", component: BasicInfoStep },
  { id: 2, title: "Características Técnicas", component: TechnicalStep },
  { id: 3, title: "Logística y Costos", component: LogisticsStep },
  { id: 4, title: "Fotos y Documentación", component: PhotosStep }
];

export const RaceWizard = ({ onClose, onSuccess, editingRace, isEditMode = false }: RaceWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<RaceFormData>>({
    modalities: [],
    terrain_profile: [],
    distances: [],
    has_wave_starts: false,
    points_cost: 100, // Default points cost
    max_guests: 1
  });
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [removedExistingPhotoIds, setRemovedExistingPhotoIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRace, updateRace } = useRaces();

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  // Initialize form data with editing race data if in edit mode
  useEffect(() => {
    if (isEditMode && editingRace) {
      console.log('Loading race data for editing:', editingRace);
      setFormData({
        name: editingRace.name || '',
        description: editingRace.description || '',
        province: editingRace.province || '',
        race_date: editingRace.race_date || '',
        registration_deadline: editingRace.registration_deadline || '',
        property_id: editingRace.property_id || '',
        modalities: editingRace.modalities || [],
        terrain_profile: editingRace.terrain_profile || [],
        distances: editingRace.distances || [],
        has_wave_starts: editingRace.has_wave_starts || false,
        distance_from_property: editingRace.distance_from_property || 0,
        official_website: editingRace.official_website || '',
        registration_cost: editingRace.registration_cost || 0,
        points_cost: editingRace.points_cost || 100,
        max_guests: editingRace.max_guests || 1,
        highlights: editingRace.highlights || '',
        local_tips: editingRace.local_tips || '',
        weather_notes: editingRace.weather_notes || ''
      });
      
      // Load existing images if they exist
      if (editingRace.images && editingRace.images.length > 0) {
        console.log('Loading existing images for editing:', editingRace.images.length, 'images');
        const existingPhotos: PhotoPreview[] = editingRace.images.map((image: any, index: number) => ({
          id: `existing-${image.id}`,
          file: null as any, // Existing images don't have file objects
          url: image.image_url,
          caption: image.caption || '',
          category: image.category || 'route',
          displayOrder: image.display_order || index,
          isExisting: true // Flag to identify existing images
        }));
        setPhotos(existingPhotos);
        console.log('✅ Loaded existing photos into wizard:', existingPhotos.length, 'photos');
        console.log('Cover photo found:', existingPhotos.find(p => p.category === 'cover') ? 'Yes' : 'No');
        console.log('Other photos:', existingPhotos.filter(p => p.category !== 'cover').length);
      } else {
        setPhotos([]);
      }
      
      // Reset removed existing photo IDs
      setRemovedExistingPhotoIds([]);
    } else {
      // Reset photos for new race creation
      setPhotos([]);
    }
  }, [isEditMode, editingRace]);

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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    console.log('Submitting race data:', formData);
    console.log('Photos to upload:', photos.length);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.province || !formData.race_date || !formData.property_id) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      // Validate race date is in the future
      const raceDate = new Date(formData.race_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (raceDate <= today) {
        toast.error('La fecha de la carrera debe ser posterior a hoy');
        return;
      }

      // Validate registration deadline if provided
      if (formData.registration_deadline) {
        const deadlineDate = new Date(formData.registration_deadline);
        if (deadlineDate >= raceDate) {
          toast.error('La fecha límite de inscripción debe ser anterior a la fecha de la carrera');
          return;
        }
      }

      if (!formData.modalities || formData.modalities.length === 0) {
        toast.error('Por favor selecciona al menos una modalidad');
        return;
      }

      if (!formData.distances || formData.distances.length === 0) {
        toast.error('Por favor selecciona al menos una distancia');
        return;
      }

      // Validate main image is required
      if (!photos.some(photo => photo.category === 'cover')) {
        toast.error('Por favor selecciona la foto principal de la carrera');
        return;
      }

      console.log(isEditMode ? 'Updating race with validated data:' : 'Creating race with validated data:', formData);
      
      let result;
      let success = false;
      
      if (isEditMode && editingRace) {
        result = await updateRace(editingRace.id, formData as RaceFormData);
        success = result !== null && result !== false && typeof result === 'object';
      } else {
        result = await createRace(formData as RaceFormData);
        success = result !== null && result !== false && typeof result === 'object';
      }
      
      if (success && result) {
        console.log(isEditMode ? 'Race updated successfully:' : 'Race created successfully:', result);
        
        // Delete removed existing photos first (only in edit mode)
        if (isEditMode && removedExistingPhotoIds.length > 0) {
          console.log('Deleting removed existing photos:', removedExistingPhotoIds);
          toast.info(`Eliminando ${removedExistingPhotoIds.length} foto(s) existente(s)...`);
          try {
            const deletePromises = removedExistingPhotoIds.map(photoId => 
              RaceService.deleteRaceImage(photoId)
            );
            await Promise.all(deletePromises);
            console.log('Successfully deleted', removedExistingPhotoIds.length, 'existing photos');
            toast.success(`Eliminadas ${removedExistingPhotoIds.length} foto(s) existente(s)`);
          } catch (deleteError: any) {
            console.error('Error deleting some existing photos:', deleteError);
            toast.warning('Error al eliminar algunas fotos existentes');
            // Continue with the process even if some deletions fail
          }
        }
        
        // Upload only new photos (not existing ones)
        const newPhotos = photos.filter(photo => !photo.isExisting);
        if (newPhotos.length > 0) {
          console.log('Uploading new photos for race:', result.id, '- New photos:', newPhotos.length, 'Total photos:', photos.length);
          toast.info(`Subiendo ${newPhotos.length} foto(s) nueva(s)...`);
          try {
            const uploadPromises = newPhotos.map(photo => 
              RaceService.uploadRaceImage(
                result.id,
                photo.file,
                photo.category,
                photo.caption,
                photo.displayOrder
              )
            );
            
            await Promise.all(uploadPromises);
            console.log('All new photos uploaded successfully');
            toast.success(isEditMode ? '¡Carrera e imágenes actualizadas exitosamente!' : '¡Carrera e imágenes creadas exitosamente!');
            
            // Fetch updated race data with photos for immediate UI update
            try {
              const { data: updatedRaceWithPhotos } = await supabase
                .from('races')
                .select(`
                  *,
                  images:race_images(
                    id,
                    image_url,
                    caption,
                    category,
                    display_order
                  )
                `)
                .eq('id', result.id)
                .single();
              
              if (updatedRaceWithPhotos) {
                console.log('Fetched updated race with photos for UI update:', updatedRaceWithPhotos);
                onSuccess(updatedRaceWithPhotos);
                return;
              }
            } catch (fetchError) {
              console.error('Error fetching updated race with photos:', fetchError);
            }
          } catch (photoError: any) {
            console.error('Error uploading photos:', photoError);
            
            // Handle specific photo upload errors
            if (photoError?.message?.includes('row-level security policy') || photoError?.message?.includes('new row violates')) {
              toast.warning(isEditMode ? 'Carrera actualizada, pero no se pudieron subir las imágenes (error de permisos)' : 'Carrera creada, pero no se pudieron subir las imágenes (error de permisos)');
            } else if (photoError?.message?.includes('Usuario no autenticado')) {
              toast.warning(isEditMode ? 'Carrera actualizada, pero no se pudieron subir las imágenes (usuario no autenticado)' : 'Carrera creada, pero no se pudieron subir las imágenes (usuario no autenticado)');
            } else if (photoError?.message?.includes('Bucket not found')) {
              toast.warning(isEditMode ? 'Carrera actualizada, pero el bucket de imágenes no está configurado' : 'Carrera creada, pero el bucket de imágenes no está configurado');
            } else {
              toast.warning(isEditMode ? 'Carrera actualizada, pero hubo un error al subir algunas imágenes' : 'Carrera creada, pero hubo un error al subir algunas imágenes');
            }
          }
        } else if (isEditMode) {
          // For edits with no new photos, still fetch updated race data
          console.log('No new photos to upload, fetching updated race data for UI update');
          try {
            const { data: updatedRaceWithPhotos } = await supabase
              .from('races')
              .select(`
                *,
                images:race_images(
                  id,
                  image_url,
                  caption,
                  category,
                  display_order
                )
              `)
              .eq('id', result.id)
              .single();
            
            if (updatedRaceWithPhotos) {
              console.log('Fetched updated race with existing photos for UI update:', updatedRaceWithPhotos);
              onSuccess(updatedRaceWithPhotos);
              return;
            }
          } catch (fetchError) {
            console.error('Error fetching updated race with existing photos:', fetchError);
          }
          toast.success('¡Carrera actualizada exitosamente!');
        } else {
          toast.success(isEditMode ? '¡Carrera actualizada exitosamente!' : '¡Carrera creada exitosamente!');
        }
        
        console.log('Calling onSuccess callback with result:', result);
        onSuccess(result); // Pass the updated/created race data to the callback
      } else {
        console.log(isEditMode ? 'Race update failed' : 'Race creation failed');
        toast.error(isEditMode ? 'Error al actualizar la carrera. Por favor intenta de nuevo.' : 'Error al crear la carrera. Por favor intenta de nuevo.');
      }
    } catch (error: any) {
      console.error(isEditMode ? 'Error updating race:' : 'Error creating race:', error);
      
      // Handle specific database constraint errors
      if (error?.code === '23514' && error?.message?.includes('race_date_future')) {
        toast.error('La fecha de la carrera debe ser posterior a hoy. Por favor selecciona una fecha futura.');
      } else if (error?.message?.includes('row-level security policy') || error?.message?.includes('new row violates')) {
        toast.error('Error de permisos al subir las imágenes. Asegúrate de estar autenticado.');
      } else if (error?.message?.includes('Bucket not found')) {
        toast.error('Bucket de almacenamiento no encontrado. Contacta al administrador.');
      } else if (error?.message?.includes('Usuario no autenticado')) {
        toast.error('Debes iniciar sesión para subir imágenes.');
      } else if (error?.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error(isEditMode ? 'Error al actualizar la carrera. Verifica que todos los campos estén completos.' : 'Error al crear la carrera. Verifica que todos los campos estén completos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (stepData: Partial<RaceFormData>) => {
    console.log('Updating form data with:', stepData);
    setFormData(prev => {
      const updated = { ...prev, ...stepData };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.province && formData.race_date && formData.property_id;
      case 2:
        return formData.modalities?.length && formData.distances?.length;
      case 3:
        return formData.points_cost !== undefined && formData.max_guests && formData.max_guests > 0 && formData.max_guests <= 4;
      case 4:
        // Require at least one main image (cover photo)
        return photos.some(photo => photo.category === 'cover');
      default:
        return false;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Current form data:', formData);
    console.log('Current step:', currentStep);
    console.log('Step valid:', isStepValid());
  }, [formData, currentStep]);

  // Safety check for step bounds
  if (currentStep < 1 || currentStep > STEPS.length) {
    console.warn('RaceWizard: Step out of bounds, resetting to step 1');
    setCurrentStep(1);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <RaceWizardErrorBoundary onReset={() => setCurrentStep(1)}>
          <div className="border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{isEditMode ? 'Editar Carrera' : 'Crear Nueva Carrera'}</h2>
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
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {currentStep === 4 ? (
              <PhotosStep
                formData={formData}
                onUpdate={updateFormData}
                photos={photos}
                setPhotos={setPhotos}
                removedExistingPhotoIds={removedExistingPhotoIds}
                setRemovedExistingPhotoIds={setRemovedExistingPhotoIds}
              />
            ) : (
              <CurrentStepComponent
                formData={formData}
                onUpdate={updateFormData}
                onNext={handleNext}
                onPrev={handlePrevious}
              />
            )}
          </div>

          <div className="border-t p-6">
            <div className="flex justify-between">
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
                    {isSubmitting ? (isEditMode ? "Actualizando..." : "Creando...") : (isEditMode ? "Actualizar Carrera" : "Crear Carrera")}
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
          </div>
        </RaceWizardErrorBoundary>
      </div>
    </div>
  );
};

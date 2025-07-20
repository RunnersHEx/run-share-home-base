
import { useState, useCallback } from "react";
import { PropertyFormData, Property } from "@/types/property";
import { useProperties } from "@/hooks/useProperties";
import { toast } from "sonner";

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
  caption: string;
  isMain: boolean;
}

export const usePropertyWizardLogic = (propertyId?: string, initialData?: Property, onClose?: () => void) => {
  const { createProperty, updateProperty, uploadPropertyImage } = useProperties();
  
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
    cancellation_policy: initialData?.cancellation_policy || "firm"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgedImportantNote, setAcknowledgedImportantNote] = useState(false);
  const [acceptedCancellationPolicy, setAcceptedCancellationPolicy] = useState(false);

  const updateFormData = useCallback((updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback((currentStep: number) => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== "" && formData.description.trim() !== "";
      case 2:
        return formData.provinces.length > 0 && formData.locality.trim() !== "" && formData.full_address.trim() !== "";
      case 3:
        return acknowledgedImportantNote;
      case 4:
        return acceptedCancellationPolicy;
      case 5:
        return true;
      default:
        return false;
    }
  }, [formData.title, formData.description, formData.provinces.length, formData.locality, formData.full_address, acknowledgedImportantNote, acceptedCancellationPolicy]);

  const handleSubmit = useCallback(async (photos: PhotoPreview[]) => {
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
        onClose?.();
      }
    } catch (error) {
      toast.error(propertyId ? "Error al actualizar la propiedad" : "Error al crear la propiedad");
    } finally {
      setIsSubmitting(false);
    }
  }, [propertyId, initialData, formData, updateProperty, createProperty, uploadPropertyImage, onClose]);

  return {
    formData,
    updateFormData,
    isSubmitting,
    acknowledgedImportantNote,
    setAcknowledgedImportantNote,
    acceptedCancellationPolicy,
    setAcceptedCancellationPolicy,
    canProceed,
    handleSubmit
  };
};

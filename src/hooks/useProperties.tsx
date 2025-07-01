
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Property, PropertyImage } from "@/types/property";
import { PropertyService } from "@/services/propertyService";

export const useProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!user) return;

    try {
      setError(null);
      const data = await PropertyService.fetchUserProperties(user.id);
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Error al cargar las propiedades');
      toast.error('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Partial<Property>) => {
    if (!user) return null;

    try {
      const data = await PropertyService.createProperty(propertyData, user.id);
      await fetchProperties();
      toast.success('Propiedad creada correctamente');
      return data;
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Error al crear la propiedad');
      return null;
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    if (!user) return false;

    try {
      await PropertyService.updateProperty(id, updates, user.id);
      await fetchProperties();
      toast.success('Propiedad actualizada correctamente');
      return true;
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Error al actualizar la propiedad');
      return false;
    }
  };

  const deleteProperty = async (id: string) => {
    if (!user) return false;

    try {
      await PropertyService.deleteProperty(id, user.id);
      await fetchProperties();
      toast.success('Propiedad eliminada correctamente');
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Error al eliminar la propiedad');
      return false;
    }
  };

  const uploadPropertyImage = async (propertyId: string, file: File, caption?: string, isMain = false) => {
    if (!user) return null;

    try {
      const imageData = await PropertyService.uploadPropertyImage(propertyId, file, user.id, caption, isMain);
      await fetchProperties();
      return imageData;
    } catch (error) {
      console.error('Error uploading property image:', error);
      toast.error('Error al subir la imagen');
      return null;
    }
  };

  const deletePropertyImage = async (imageId: string) => {
    try {
      await PropertyService.deletePropertyImage(imageId);
      await fetchProperties();
      toast.success('Imagen eliminada correctamente');
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar la imagen');
      return false;
    }
  };

  const togglePropertyStatus = async (id: string, isActive: boolean) => {
    return updateProperty(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    deletePropertyImage,
    togglePropertyStatus,
    refetchProperties: fetchProperties
  };
};


import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  provinces: string[];
  locality: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  house_rules: string | null;
  check_in_instructions: string | null;
  runner_instructions: string | null;
  cancellation_policy: string;
  is_active: boolean;
  total_bookings: number;
  average_rating: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_main: boolean;
  created_at: string;
}

export const useProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const propertiesWithImages = data?.map(property => ({
        ...property,
        images: property.property_images || []
      })) || [];

      setProperties(propertiesWithImages);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Partial<Property>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${propertyId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const { data: imageData, error: insertError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: data.publicUrl,
          caption: caption || null,
          is_main: isMain
        })
        .select()
        .single();

      if (insertError) throw insertError;

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
      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

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
    createProperty,
    updateProperty,
    deleteProperty,
    uploadPropertyImage,
    deletePropertyImage,
    togglePropertyStatus,
    refetchProperties: fetchProperties
  };
};

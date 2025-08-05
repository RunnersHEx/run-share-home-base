
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyFormData, PropertyImage } from "@/types/property";
import { cleanPropertyDataForInsert, cleanPropertyDataForUpdate } from "@/utils/propertyUtils";

export class PropertyService {
  static async fetchUserProperties(userId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (*)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(property => ({
      ...property,
      approval_status: (property as any).approval_status ?? 'pending',
      // Sort images so main photo comes first, then by created_at
      images: (property.property_images || []).sort((a: any, b: any) => {
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
    })) || [];
  }

  static async createProperty(propertyData: Partial<Property>, userId: string): Promise<Property> {
    const insertData = cleanPropertyDataForInsert(propertyData, userId);

    const { data, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    // Add default approval_status if missing with type assertion
    return {
      ...data,
      approval_status: (data as any).approval_status ?? 'pending'
    };
  }

  static async updateProperty(id: string, updates: Partial<Property>, userId: string): Promise<void> {
    const updateData = cleanPropertyDataForUpdate(updates);

    const { error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) throw error;
  }

  static async deleteProperty(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) throw error;
  }

  static async uploadPropertyImage(
    propertyId: string, 
    file: File, 
    userId: string, 
    caption?: string, 
    isMain = false
  ): Promise<PropertyImage> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${propertyId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    // If this image is marked as main, clear the main flag from all other images for this property
    if (isMain) {
      await supabase
        .from('property_images')
        .update({ is_main: false })
        .eq('property_id', propertyId);
    }

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
    return imageData;
  }

  static async deletePropertyImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  }

  static async setMainPropertyImage(propertyId: string, imageId: string): Promise<void> {
    // First, clear all main flags for this property
    await supabase
      .from('property_images')
      .update({ is_main: false })
      .eq('property_id', propertyId);

    // Then set the specified image as main
    const { error } = await supabase
      .from('property_images')
      .update({ is_main: true })
      .eq('id', imageId)
      .eq('property_id', propertyId);

    if (error) throw error;
  }
}

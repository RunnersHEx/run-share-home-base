
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
      approval_status: property.approval_status ?? 'pending', // Handle optional field
      images: property.property_images || []
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
    
    // Add default approval_status if missing
    return {
      ...data,
      approval_status: data.approval_status ?? 'pending'
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
}

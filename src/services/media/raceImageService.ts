import { supabase } from "@/integrations/supabase/client";
import { RaceImage } from "@/types/race";

export class RaceImageService {
  static async uploadRaceImage(
    raceId: string, 
    file: File, 
    category: string, 
    caption?: string,
    displayOrder?: number
  ): Promise<RaceImage> {
    try {
      // Get current user for proper folder structure
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Generate unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${raceId}/${Date.now()}.${fileExt}`;
      
      // Upload image to race-images storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('race-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('race-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Use provided display order or get next available
      let finalDisplayOrder = displayOrder;
      if (finalDisplayOrder === undefined) {
        const { data: maxOrderData } = await supabase
          .from('race_images')
          .select('display_order')
          .eq('race_id', raceId)
          .order('display_order', { ascending: false })
          .limit(1);

        finalDisplayOrder = (maxOrderData?.[0]?.display_order || -1) + 1;
      }

      // Insert race image record
      const { data, error } = await supabase
        .from('race_images')
        .insert({
          race_id: raceId,
          image_url: imageUrl,
          category: category as any,
          caption: caption || null,
          display_order: finalDisplayOrder
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error saving image record: ${error.message}`);
      }

      return {
        ...data,
        category: data.category as any
      } as RaceImage;
    } catch (error) {
      console.error('Error in uploadRaceImage:', error);
      throw error;
    }
  }

  static async getRaceImages(raceId: string): Promise<RaceImage[]> {
    try {
      const { data, error } = await supabase
        .from('race_images')
        .select('*')
        .eq('race_id', raceId)
        .order('display_order');

      if (error) {
        throw new Error(`Error fetching race images: ${error.message}`);
      }

      return (data || []).map(image => ({
        ...image,
        category: image.category as any
      })) as RaceImage[];
    } catch (error) {
      console.error('Error in getRaceImages:', error);
      throw error;
    }
  }

  static async updateRaceImage(
    imageId: string, 
    updates: {
      caption?: string;
      category?: string;
      display_order?: number;
    }
  ): Promise<RaceImage> {
    try {
      const { data, error } = await supabase
        .from('race_images')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating race image: ${error.message}`);
      }

      return {
        ...data,
        category: data.category as any
      } as RaceImage;
    } catch (error) {
      console.error('Error in updateRaceImage:', error);
      throw error;
    }
  }

  static async deleteRaceImage(imageId: string): Promise<void> {
    try {
      // Get image info first
      const { data: imageData, error: fetchError } = await supabase
        .from('race_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching image data: ${fetchError.message}`);
      }

      // Extract file path from URL for storage deletion
      const url = new URL(imageData.image_url);
      const pathParts = url.pathname.split('/');
      // Path structure: /storage/v1/object/race-images/userId/raceId/filename.ext
      // We want: userId/raceId/filename.ext
      const bucketIndex = pathParts.findIndex(part => part === 'race-images');
      const filePath = bucketIndex !== -1 ? pathParts.slice(bucketIndex + 1).join('/') : null;
      
      if (filePath) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('race-images')
          .remove([filePath]);

        if (storageError) {
          console.warn('Error deleting from storage:', storageError.message);
          // Don't throw here, continue with database deletion
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('race_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        throw new Error(`Error deleting race image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteRaceImage:', error);
      throw error;
    }
  }

  static async reorderImages(raceId: string, imageIds: string[]): Promise<void> {
    try {
      // Update display order for each image
      const updates = imageIds.map((imageId, index) => 
        supabase
          .from('race_images')
          .update({ display_order: index })
          .eq('id', imageId)
          .eq('race_id', raceId)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error in reorderImages:', error);
      throw error;
    }
  }

  static async uploadMultipleRaceImages(
    raceId: string,
    files: File[],
    category: string = 'landscape'
  ): Promise<RaceImage[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadRaceImage(
          raceId,
          file,
          category,
          '', // Empty caption by default
          index // Use index as display order
        )
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error in uploadMultipleRaceImages:', error);
      throw error;
    }
  }

  static async setCoverImage(raceId: string, imageId: string): Promise<void> {
    try {
      // Update the specific image to be cover category
      const { error } = await supabase
        .from('race_images')
        .update({ category: 'cover' })
        .eq('id', imageId)
        .eq('race_id', raceId);

      if (error) {
        throw new Error(`Error setting cover image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in setCoverImage:', error);
      throw error;
    }
  }

  static async getRaceMainImage(raceId: string): Promise<string | null> {
    try {
      const images = await this.getRaceImages(raceId);
      
      // Find main image: first by 'cover' category, then by lowest display_order
      const coverImage = images.find(img => img.category === 'cover');
      const mainImage = coverImage || images.sort((a, b) => a.display_order - b.display_order)[0];
      
      return mainImage?.image_url || null;
    } catch (error) {
      console.error('Error in getRaceMainImage:', error);
      return null;
    }
  }
}

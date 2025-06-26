
import { supabase } from "@/integrations/supabase/client";
import { RaceImage } from "@/types/race";

export class RaceImageService {
  static async uploadRaceImage(raceId: string, file: File, category: string): Promise<RaceImage> {
    // Upload image to storage (implement based on your storage solution)
    const imageUrl = "placeholder-url"; // Replace with actual upload logic

    const { data, error } = await supabase
      .from('race_images')
      .insert({
        race_id: raceId,
        image_url: imageUrl,
        category: category as any,
        display_order: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      category: data.category as any
    } as RaceImage;
  }

  static async getRaceImages(raceId: string): Promise<RaceImage[]> {
    const { data, error } = await supabase
      .from('race_images')
      .select('*')
      .eq('race_id', raceId)
      .order('display_order');

    if (error) {
      throw error;
    }

    return (data || []).map(image => ({
      ...image,
      category: image.category as any
    })) as RaceImage[];
  }
}

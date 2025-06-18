
import { supabase } from "@/integrations/supabase/client";
import { PropertyAvailability, AvailabilityFormData } from "@/types/availability";

export class AvailabilityService {
  static async fetchPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PropertyAvailability[]> {
    const { data, error } = await supabase
      .from('property_availability')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async updateAvailability(
    propertyId: string,
    availabilityData: AvailabilityFormData
  ): Promise<void> {
    const updates = availabilityData.dates.map(date => ({
      property_id: propertyId,
      date,
      status: availabilityData.status,
      notes: availabilityData.notes || null
    }));

    const { error } = await supabase
      .from('property_availability')
      .upsert(updates, { 
        onConflict: 'property_id,date',
        ignoreDuplicates: false 
      });

    if (error) throw error;
  }

  static async deleteAvailability(propertyId: string, dates: string[]): Promise<void> {
    const { error } = await supabase
      .from('property_availability')
      .delete()
      .eq('property_id', propertyId)
      .in('date', dates);

    if (error) throw error;
  }

  static async bulkUpdateAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
    status: 'available' | 'blocked',
    notes?: string
  ): Promise<void> {
    // Generate all dates in range
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    await this.updateAvailability(propertyId, { dates, status, notes });
  }
}

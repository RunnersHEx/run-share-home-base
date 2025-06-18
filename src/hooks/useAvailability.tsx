
import { useState, useEffect } from "react";
import { AvailabilityService } from "@/services/availabilityService";
import { PropertyAvailability, AvailabilityFormData } from "@/types/availability";
import { toast } from "sonner";

export const useAvailability = (propertyId: string) => {
  const [availability, setAvailability] = useState<PropertyAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const data = await AvailabilityService.fetchPropertyAvailability(
        propertyId,
        startDate,
        endDate
      );
      setAvailability(data);
      return data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Error al cargar disponibilidad');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (data: AvailabilityFormData) => {
    try {
      setLoading(true);
      await AvailabilityService.updateAvailability(propertyId, data);
      toast.success('Disponibilidad actualizada correctamente');
      return true;
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Error al actualizar disponibilidad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateAvailability = async (
    startDate: string,
    endDate: string,
    status: 'available' | 'blocked',
    notes?: string
  ) => {
    try {
      setLoading(true);
      await AvailabilityService.bulkUpdateAvailability(
        propertyId,
        startDate,
        endDate,
        status,
        notes
      );
      toast.success('Disponibilidad actualizada en lote');
      return true;
    } catch (error) {
      console.error('Error bulk updating availability:', error);
      toast.error('Error al actualizar disponibilidad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAvailability = async (dates: string[]) => {
    try {
      setLoading(true);
      await AvailabilityService.deleteAvailability(propertyId, dates);
      toast.success('Fechas eliminadas correctamente');
      return true;
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Error al eliminar fechas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    availability,
    loading,
    fetchAvailability,
    updateAvailability,
    bulkUpdateAvailability,
    deleteAvailability
  };
};

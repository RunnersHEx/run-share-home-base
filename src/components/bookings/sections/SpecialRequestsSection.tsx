
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingFormData } from "@/types/booking";

interface SpecialRequestsSectionProps {
  formData: Partial<BookingFormData>;
  setFormData: (data: Partial<BookingFormData> | ((prev: Partial<BookingFormData>) => Partial<BookingFormData>)) => void;
}

export const SpecialRequestsSection = ({ formData, setFormData }: SpecialRequestsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes Especiales</CardTitle>
        <CardDescription>Información adicional que el host debería conocer</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={formData.special_requests || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
          placeholder="Ej: Restricciones dietéticas, necesidad de desayuno temprano, solicitud de transporte, alergias, etc."
          className="min-h-[80px]"
          maxLength={300}
        />
        <p className="text-sm text-gray-500 mt-2">
          {(formData.special_requests || '').length}/300 caracteres
        </p>
      </CardContent>
    </Card>
  );
};

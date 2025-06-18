
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmergencyContactFormProps {
  formData: {
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const EmergencyContactForm = ({ formData, onInputChange }: EmergencyContactFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Nombre</Label>
          <Input
            id="emergencyContactName"
            placeholder="Nombre del contacto"
            value={formData.emergencyContactName}
            onChange={(e) => onInputChange("emergencyContactName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Teléfono</Label>
          <Input
            id="emergencyContactPhone"
            type="tel"
            placeholder="+34 123 456 789"
            value={formData.emergencyContactPhone}
            onChange={(e) => onInputChange("emergencyContactPhone", e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactForm;

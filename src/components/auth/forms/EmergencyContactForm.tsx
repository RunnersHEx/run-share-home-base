
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface EmergencyContactFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isLoading: boolean;
}

const EmergencyContactForm = ({ onSubmit, onBack, initialData, isLoading }: EmergencyContactFormProps) => {
  const [formData, setFormData] = useState({
    emergencyContactName: initialData.emergencyContactName || "",
    emergencyContactPhone: initialData.emergencyContactPhone || ""
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Nombre</Label>
          <Input
            id="emergencyContactName"
            placeholder="Nombre del contacto"
            value={formData.emergencyContactName}
            onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
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
            onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </form>
  );
};

export default EmergencyContactForm;

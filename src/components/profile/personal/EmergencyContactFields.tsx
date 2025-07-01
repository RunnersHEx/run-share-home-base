
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmergencyContactFieldsProps {
  formData: any;
  profile: any;
  isEditing: boolean;
  handleInputChange: (field: string, value: string) => void;
}

export const EmergencyContactFields = ({ formData, profile, isEditing, handleInputChange }: EmergencyContactFieldsProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Contacto de Emergencia</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Nombre del Contacto</Label>
          <Input
            id="emergency_contact_name"
            value={isEditing ? formData.emergency_contact_name : (profile?.emergency_contact_name || '')}
            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
            placeholder={isEditing ? "Nombre del contacto de emergencia" : "No especificado"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Teléfono del Contacto</Label>
          <Input
            id="emergency_contact_phone"
            type="tel"
            value={isEditing ? formData.emergency_contact_phone : (profile?.emergency_contact_phone || '')}
            onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
            placeholder={isEditing ? "Teléfono del contacto" : "No especificado"}
          />
        </div>
      </div>
    </div>
  );
};

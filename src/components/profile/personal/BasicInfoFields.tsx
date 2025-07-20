
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateUtils } from "@/utils/dateUtils";

interface BasicInfoFieldsProps {
  formData: any;
  profile: any;
  isEditing: boolean;
  handleInputChange: (field: string, value: string) => void;
}

export const BasicInfoFields = ({ formData, profile, isEditing, handleInputChange }: BasicInfoFieldsProps) => {
  const displayBirthDate = isEditing 
    ? dateUtils.formatForInput(formData.birth_date) 
    : dateUtils.formatForInput(profile?.birth_date);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">Nombre</Label>
        <Input
          id="first_name"
          value={isEditing ? formData.first_name : (profile?.first_name || '')}
          onChange={(e) => handleInputChange('first_name', e.target.value)}
          disabled={!isEditing}
          className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
          placeholder={isEditing ? "Ingresa tu nombre" : "No especificado"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_name">Apellidos</Label>
        <Input
          id="last_name"
          value={isEditing ? formData.last_name : (profile?.last_name || '')}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          disabled={!isEditing}
          className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
          placeholder={isEditing ? "Ingresa tus apellidos" : "No especificado"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          value={isEditing ? formData.phone : (profile?.phone || '')}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          disabled={!isEditing}
          className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
          placeholder={isEditing ? "Ingresa tu teléfono" : "No especificado"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
        <Input
          id="birth_date"
          type="date"
          value={displayBirthDate}
          onChange={(e) => handleInputChange('birth_date', e.target.value)}
          disabled={!isEditing}
          className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
          placeholder={isEditing ? "dd/mm/yyyy" : "No especificado"}
        />
      </div>
    </div>
  );
};

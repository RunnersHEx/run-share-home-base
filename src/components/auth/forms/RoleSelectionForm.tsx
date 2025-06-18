
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface RoleSelectionFormProps {
  formData: {
    isHost: boolean;
    isGuest: boolean;
  };
  onInputChange: (field: string, value: any) => void;
}

const RoleSelectionForm = ({ formData, onInputChange }: RoleSelectionFormProps) => {
  const handleHostChange = (checked: boolean | string) => {
    onInputChange("isHost", !!checked);
  };

  const handleGuestChange = (checked: boolean | string) => {
    onInputChange("isGuest", !!checked);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">¿Cómo quieres usar la plataforma?</h3>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            💡 Recomendación: Activa ambos roles para poder desempeñar tanto como Host como Guest y aprovechar al máximo la plataforma.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox 
              checked={formData.isHost} 
              onCheckedChange={handleHostChange}
            />
            <Label className="font-semibold text-blue-700">Quiero ser Host</Label>
          </div>
          <p className="text-sm text-gray-600">
            Ofrecer mi casa, carreras cercanas y conocimiento local a corredores que quieran venir a participar en ellas y visitar la zona
          </p>
        </div>
        
        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox 
              checked={formData.isGuest} 
              onCheckedChange={handleGuestChange}
            />
            <Label className="font-semibold text-orange-700">Quiero ser Guest</Label>
          </div>
          <p className="text-sm text-gray-600">
            Buscar carreras que me atraigan, alojamiento cercano y experiencia local
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionForm;

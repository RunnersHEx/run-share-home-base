
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

interface RoleSelectionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isLoading: boolean;
}

const RoleSelectionForm = ({ onSubmit, onBack, initialData, isLoading }: RoleSelectionFormProps) => {
  const [formData, setFormData] = useState({
    isHost: true, // Always true as it's mandatory
    isGuest: true // Always true as it's mandatory
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Comienza a usar la plataforma</h3>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            Comienza a desempeñar las funciones tanto de Host como Guest y disfrutar al máximo de la experiencia
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox 
              checked={true} 
              disabled={true}
            />
            <Label className="font-semibold text-blue-700">Quiero ser Host</Label>
          </div>
          <p className="text-sm text-gray-600">
            Ofrecer mi casa, carreras cercanas y conocimiento local a corredores que quieran venir a participar en ellas y visitar la zona
          </p>
        </div>
        
        <div className="border-2 border-orange-500 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox 
              checked={true} 
              disabled={true}
            />
            <Label className="font-semibold text-orange-700">Quiero ser Guest</Label>
          </div>
          <p className="text-sm text-gray-600">
            Buscar carreras que me atraigan, alojamiento cercano y experiencia local
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </div>
    </form>
  );
};

export default RoleSelectionForm;

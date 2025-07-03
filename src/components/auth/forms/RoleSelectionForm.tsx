
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Comienza a usar la plataforma</h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Comienza a desempeñar las funciones tanto de Host como Guest y disfrutar al máximo de la experiencia
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

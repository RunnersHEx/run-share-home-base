
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";

interface RulesStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const RulesStep = ({ formData, onUpdate, onNext, onPrev }: RulesStepProps) => {
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Normas y Políticas</h2>
        <p className="text-gray-600">
          Establece las reglas de tu hogar para una convivencia perfecta.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="house_rules">Normas de la Casa</Label>
            <Textarea
              id="house_rules"
              placeholder="Ej: No fumar, No mascotas, Silencio después de las 22:00h, etc."
              value={formData.house_rules || ''}
              onChange={(e) => handleInputChange('house_rules', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Define las normas básicas que deben seguir tus huéspedes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_in_instructions">Instrucciones de Check-in</Label>
            <Textarea
              id="check_in_instructions"
              placeholder="Ej: Las llaves están en la caja fuerte del portal (código 1234), el timbre es el 2A..."
              value={formData.check_in_instructions || ''}
              onChange={(e) => handleInputChange('check_in_instructions', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Explica cómo pueden acceder a tu propiedad
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button 
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default RulesStep;

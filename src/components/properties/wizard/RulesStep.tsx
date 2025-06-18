import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, User, RotateCcw } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface RulesStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const RulesStep = ({ formData, updateFormData }: RulesStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Reglas y Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="house_rules" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reglas de la Casa
            </Label>
            <Textarea
              id="house_rules"
              value={formData.house_rules}
              onChange={(e) => updateFormData({ house_rules: e.target.value })}
              placeholder="Ej: No fumar, no mascotas, silencio después de las 22:00h..."
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Establece reglas claras para que tus guests sepan qué esperar
            </p>
          </div>

          <div>
            <Label htmlFor="check_in_instructions" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Instrucciones de Check-in
            </Label>
            <Textarea
              id="check_in_instructions"
              value={formData.check_in_instructions}
              onChange={(e) => updateFormData({ check_in_instructions: e.target.value })}
              placeholder="Ej: Las llaves están en el buzón, el código es 1234..."
              rows={3}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Recuerda que una vez hagas Match con el Guest, hablarán sobre ello a través del canal interno
            </p>
          </div>

          <div>
            <Label htmlFor="runner_instructions" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Instrucciones Especiales para Runners
            </Label>
            <Textarea
              id="runner_instructions"
              value={formData.runner_instructions}
              onChange={(e) => updateFormData({ runner_instructions: e.target.value })}
              placeholder="Ej: Mejores rutas para correr, horarios recomendados, dónde guardar material deportivo..."
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Comparte tu conocimiento local sobre las mejores rutas y consejos para correr en tu área
            </p>
          </div>

          <div>
            <Label htmlFor="cancellation_policy" className="flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Política de Cancelación
            </Label>
            <Select 
              value={formData.cancellation_policy} 
              onValueChange={(value) => updateFormData({ cancellation_policy: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecciona una política" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">
                  <div className="py-2">
                    <div className="font-medium">Flexible</div>
                    <div className="text-sm text-gray-600">Cancelación gratuita hasta 24h antes</div>
                  </div>
                </SelectItem>
                <SelectItem value="moderate">
                  <div className="py-2">
                    <div className="font-medium">Moderada</div>
                    <div className="text-sm text-gray-600">Cancelación gratuita hasta 5 días antes</div>
                  </div>
                </SelectItem>
                <SelectItem value="strict">
                  <div className="py-2">
                    <div className="font-medium">Estricta</div>
                    <div className="text-sm text-gray-600">Sin reembolso por cancelación</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesStep;

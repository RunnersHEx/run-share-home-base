
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyFormData } from "@/types/property";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Key, Coffee, Info } from "lucide-react";

interface RulesStepProps {
  formData: PropertyFormData;
  onUpdate: (data: Partial<PropertyFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const RulesStep = ({ formData, onUpdate, onNext, onPrev }: RulesStepProps) => {
  const commonRules = [
    "No mascotas",
    "No beber",
    "Silencio después de las 24h",
    "No usar nada sin previo permiso al Host"
  ];

  const handleRuleToggle = (rule: string) => {
    const currentRules = formData.house_rules || '';
    const rulesArray = currentRules.split('\n').filter(r => r.trim() !== '');
    
    if (rulesArray.includes(rule)) {
      const newRules = rulesArray.filter(r => r !== rule).join('\n');
      onUpdate({ house_rules: newRules });
    } else {
      const newRules = [...rulesArray, rule].join('\n');
      onUpdate({ house_rules: newRules });
    }
  };

  const isRuleSelected = (rule: string) => {
    const currentRules = formData.house_rules || '';
    return currentRules.includes(rule);
  };

  return (
    <div className="space-y-6">
      {/* House Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Reglas de la Casa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {commonRules.map((rule) => (
              <div key={rule} className="flex items-center space-x-2">
                <Checkbox
                  id={rule}
                  checked={isRuleSelected(rule)}
                  onCheckedChange={() => handleRuleToggle(rule)}
                />
                <Label htmlFor={rule} className="text-sm font-medium">
                  {rule}
                </Label>
              </div>
            ))}
          </div>
          
          <div>
            <Label htmlFor="custom_rules">Si quieres añadir alguna norma más, escríbela aquí:</Label>
            <Textarea
              id="custom_rules"
              value={formData.house_rules || ''}
              onChange={(e) => onUpdate({ house_rules: e.target.value })}
              placeholder="Escribe aquí cualquier regla adicional..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Check-in Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Instrucciones de Check-in</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="checkin_instructions">Check-in: Una vez hecho el Match con tu Host, procederéis a hablar entre vosotros.</Label>
            <Textarea
              id="checkin_instructions"
              value={formData.check_in_instructions || ''}
              onChange={(e) => onUpdate({ check_in_instructions: e.target.value })}
              placeholder="Ej: Llaves en el buzón, código de entrada, horario de llegada..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Runner Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="h-5 w-5" />
            <span>Instrucciones para Runners</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="runner_instructions">Instrucciones específicas para runners (opcional)</Label>
            <Textarea
              id="runner_instructions"
              value={formData.runner_instructions || ''}
              onChange={(e) => onUpdate({ runner_instructions: e.target.value })}
              placeholder="Ej: Mejor hora para correr, rutas recomendadas, dónde dejar material de running..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Política de Cancelación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="cancellation_policy">Política de cancelación</Label>
            <Select 
              value={formData.cancellation_policy} 
              onValueChange={(value) => onUpdate({ cancellation_policy: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona una política" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible - Cancelación gratuita hasta 24h antes</SelectItem>
                <SelectItem value="moderate">Moderada - Cancelación gratuita hasta 5 días antes</SelectItem>
                <SelectItem value="strict">Estricta - Cancelación gratuita hasta 14 días antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesStep;


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  
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

  // Get additional rules (not in common rules)
  const getAdditionalRules = () => {
    const currentRules = formData.house_rules || '';
    const rulesArray = currentRules.split('\n').filter(r => r.trim() !== '');
    return rulesArray.filter(rule => !commonRules.includes(rule)).join('\n');
  };

  const handleAdditionalRulesChange = (additionalRules: string) => {
    const selectedCommonRules = commonRules.filter(rule => isRuleSelected(rule));
    const allRules = [...selectedCommonRules];
    
    if (additionalRules.trim()) {
      const additionalRulesArray = additionalRules.split('\n').filter(r => r.trim() !== '');
      allRules.push(...additionalRulesArray);
    }
    
    onUpdate({ house_rules: allRules.join('\n') });
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
              value={getAdditionalRules()}
              onChange={(e) => handleAdditionalRulesChange(e.target.value)}
              placeholder=""
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
              placeholder=""
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
            <span>Política de Cancelación Firme</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Política de Cancelación:</strong> Reembolso total de los créditos si se cancela con 60 días de antelación. 
              Si la reserva se realiza con menos de 60 días y se cancelara se perderían los créditos.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept_policy"
              checked={acceptedPolicy}
              onCheckedChange={(checked) => {
                setAcceptedPolicy(checked as boolean);
                onUpdate({ cancellation_policy: "firm" });
              }}
            />
            <Label htmlFor="accept_policy" className="text-sm font-medium">
              Acepto la política de cancelación
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesStep;

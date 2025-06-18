
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, RotateCcw } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface RulesStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const BASIC_RULES = [
  { id: "no_smoking", label: "No fumar" },
  { id: "no_pets", label: "No mascotas" },
  { id: "no_parties", label: "No fiestas" },
  { id: "quiet_after_2330", label: "Silencio a partir de las 23:30h" },
  { id: "no_services_without_permission", label: "No usar ningún servicio de la casa sin permiso previo" }
];

const RulesStep = ({ formData, updateFormData }: RulesStepProps) => {
  const handleBasicRuleChange = (ruleId: string, checked: boolean) => {
    const currentRules = formData.house_rules || "";
    const rule = BASIC_RULES.find(r => r.id === ruleId);
    
    if (!rule) return;
    
    let updatedRules = currentRules;
    
    if (checked) {
      // Add rule if not already present
      if (!currentRules.includes(rule.label)) {
        updatedRules = currentRules ? `${currentRules}, ${rule.label}` : rule.label;
      }
    } else {
      // Remove rule
      updatedRules = currentRules
        .split(', ')
        .filter(r => r !== rule.label)
        .join(', ');
    }
    
    updateFormData({ house_rules: updatedRules });
  };

  const isRuleSelected = (ruleId: string) => {
    const rule = BASIC_RULES.find(r => r.id === ruleId);
    return rule ? (formData.house_rules || "").includes(rule.label) : false;
  };

  const getAdditionalRules = () => {
    const currentRules = formData.house_rules || "";
    const basicRuleLabels = BASIC_RULES.map(r => r.label);
    
    return currentRules
      .split(', ')
      .filter(rule => rule.trim() && !basicRuleLabels.includes(rule.trim()))
      .join(', ');
  };

  const handleAdditionalRulesChange = (additionalRules: string) => {
    const selectedBasicRules = BASIC_RULES
      .filter(rule => isRuleSelected(rule.id))
      .map(rule => rule.label);
    
    const allRules = [...selectedBasicRules];
    if (additionalRules.trim()) {
      allRules.push(additionalRules.trim());
    }
    
    updateFormData({ house_rules: allRules.join(', ') });
  };

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
            <Label className="flex items-center mb-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reglas de la Casa
            </Label>
            
            <div className="space-y-3 mb-4">
              {BASIC_RULES.map((rule) => (
                <div key={rule.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={rule.id}
                    checked={isRuleSelected(rule.id)}
                    onCheckedChange={(checked) => handleBasicRuleChange(rule.id, checked as boolean)}
                  />
                  <Label htmlFor={rule.id} className="font-normal cursor-pointer">
                    {rule.label}
                  </Label>
                </div>
              ))}
            </div>

            <Label htmlFor="additional_rules" className="text-sm text-gray-600 mb-2 block">
              Si deseas agregar alguna regla de la casa más, escríbela aquí
            </Label>
            <Textarea
              id="additional_rules"
              value={getAdditionalRules()}
              onChange={(e) => handleAdditionalRulesChange(e.target.value)}
              placeholder="Reglas adicionales..."
              rows={3}
              className="mt-2"
            />
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


import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";

interface RulesStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const HOUSE_RULES_OPTIONS = [
  "No fumar",
  "No mascotas", 
  "No beber",
  "Silencio después de las 24h",
  "No usar nada sin previo permiso al Host"
];

const RulesStep = ({ formData, onUpdate, onNext, onPrev }: RulesStepProps) => {
  const handleRuleToggle = (rule: string, checked: boolean) => {
    const currentRules = formData.house_rules || '';
    const rulesArray = currentRules.split('\n').filter((r: string) => r.trim() !== '');
    
    let updatedRules;
    if (checked) {
      updatedRules = [...rulesArray, rule];
    } else {
      updatedRules = rulesArray.filter((r: string) => r !== rule);
    }
    
    onUpdate({ house_rules: updatedRules.join('\n') });
  };

  const handleCustomRulesChange = (value: string) => {
    const currentRules = formData.house_rules || '';
    const rulesArray = currentRules.split('\n').filter((r: string) => r.trim() !== '');
    
    // Filtrar las reglas predefinidas
    const customRules = rulesArray.filter((rule: string) => !HOUSE_RULES_OPTIONS.includes(rule));
    const predefinedRules = rulesArray.filter((rule: string) => HOUSE_RULES_OPTIONS.includes(rule));
    
    // Agregar las nuevas reglas personalizadas
    const newCustomRules = value.split('\n').filter((r: string) => r.trim() !== '');
    const allRules = [...predefinedRules, ...newCustomRules];
    
    onUpdate({ house_rules: allRules.join('\n') });
  };

  const isRuleSelected = (rule: string) => {
    const currentRules = formData.house_rules || '';
    return currentRules.includes(rule);
  };

  const getCustomRules = () => {
    const currentRules = formData.house_rules || '';
    const rulesArray = currentRules.split('\n').filter((r: string) => r.trim() !== '');
    return rulesArray.filter((rule: string) => !HOUSE_RULES_OPTIONS.includes(rule)).join('\n');
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
          <div className="space-y-4">
            <Label>Normas de la Casa</Label>
            <div className="space-y-3">
              {HOUSE_RULES_OPTIONS.map((rule) => (
                <div key={rule} className="flex items-center space-x-2">
                  <Checkbox
                    id={rule}
                    checked={isRuleSelected(rule)}
                    onCheckedChange={(checked) => handleRuleToggle(rule, checked as boolean)}
                  />
                  <Label htmlFor={rule} className="text-sm font-normal cursor-pointer">
                    {rule}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Si quieres añadir alguna norma más, escríbela aquí"
                value={getCustomRules()}
                onChange={(e) => handleCustomRulesChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Check-in:</strong> Una vez hecho el Match con tu Host, procederéis a hablar entre vosotros.
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

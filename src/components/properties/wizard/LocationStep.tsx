
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowLeft, ArrowRight } from "lucide-react";

interface LocationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LocationStep = ({ formData, onUpdate, onNext, onPrev }: LocationStepProps) => {
  const handleInputChange = (field: string, value: string | string[]) => {
    onUpdate({ [field]: value });
  };

  const handleNext = () => {
    if (!formData.full_address || !formData.locality) {
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ubicación de tu Propiedad</h2>
        <p className="text-gray-600">
          Indica dónde se encuentra tu propiedad para que los runners puedan encontrarla fácilmente.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_address">Dirección (solo calle sin Nº. La dirección exacta se la proporcionará el Host al Guest cuando hagan Match y nunca antes) *</Label>
            <Input
              id="full_address"
              placeholder="Calle Principal"
              value={formData.full_address || ''}
              onChange={(e) => handleInputChange('full_address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locality">Ciudad/Localidad *</Label>
              <Input
                id="locality"
                placeholder="Madrid"
                value={formData.locality || ''}
                onChange={(e) => handleInputChange('locality', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provinces">Provincia</Label>
              <Input
                id="provinces"
                placeholder="Madrid"
                value={formData.provinces?.[0] || ''}
                onChange={(e) => handleInputChange('provinces', [e.target.value])}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="runner_instructions">Describe si existen zonas cercanas a tu casa para correr (Opcional)</Label>
            <Textarea
              id="runner_instructions"
              placeholder="Describe las mejores rutas cercanas, parques, senderos o cualquier información útil para correr en la zona..."
              value={formData.runner_instructions || ''}
              onChange={(e) => handleInputChange('runner_instructions', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!formData.full_address || !formData.locality}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default LocationStep;

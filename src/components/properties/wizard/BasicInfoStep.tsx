
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "../PropertyWizard";

interface BasicInfoStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const BasicInfoStep = ({ formData, updateFormData }: BasicInfoStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Básica de tu Propiedad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">Título de la propiedad *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="Ej: Apartamento acogedor cerca del parque"
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Crea un título atractivo que describa tu espacio
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Describe tu propiedad, el barrio, y por qué es especial para runners..."
              rows={6}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Comparte detalles sobre tu espacio, el área local, y cualquier característica especial para corredores
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bedrooms">Dormitorios *</Label>
              <Input
                id="bedrooms"
                type="number"
                min="1"
                max="10"
                value={formData.bedrooms}
                onChange={(e) => updateFormData({ bedrooms: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="beds">Camas *</Label>
              <Input
                id="beds"
                type="number"
                min="1"
                max="20"
                value={formData.beds}
                onChange={(e) => updateFormData({ beds: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Baños *</Label>
              <Input
                id="bathrooms"
                type="number"
                min="1"
                max="10"
                value={formData.bathrooms}
                onChange={(e) => updateFormData({ bathrooms: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="max_guests">Max Huéspedes *</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                max="16"
                value={formData.max_guests}
                onChange={(e) => updateFormData({ max_guests: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInfoStep;

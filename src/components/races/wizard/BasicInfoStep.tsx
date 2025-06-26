
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RaceFormData } from "@/types/race";
import { useProperties } from "@/hooks/useProperties";
import { CalendarDays, FileText, Home } from "lucide-react";

interface BasicInfoStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const BasicInfoStep = ({ formData, onUpdate, onNext, onPrev }: BasicInfoStepProps) => {
  const { properties } = useProperties();

  return (
    <div className="space-y-6">
      {/* Race Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Información Básica de la Carrera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="race-name">Nombre de la Carrera *</Label>
            <Input
              id="race-name"
              value={formData.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Ej: 10K Valencia, Maratón de Barcelona..."
            />
            <p className="text-sm text-gray-600 mt-1">
              Elige un nombre atractivo que describa la carrera
            </p>
          </div>

          <div>
            <Label htmlFor="race-description">¿Por qué crees que es atractiva esta carrera? *</Label>
            <Textarea
              id="race-description"
              value={formData.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe qué hace especial a esta carrera, su historia, el recorrido, el ambiente..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-600 mt-1">
              Máximo 500 palabras (0/500)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date and Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Fechas y Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="race-date">Fecha de la Carrera *</Label>
              <Input
                id="race-date"
                type="date"
                value={formData.race_date || ""}
                onChange={(e) => onUpdate({ race_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="registration-deadline">Fecha Límite Inscripción</Label>
              <Input
                id="registration-deadline"
                type="date"
                value={formData.registration_deadline || ""}
                onChange={(e) => onUpdate({ registration_deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="property-select">Propiedad Asociada *</Label>
            <Select 
              value={formData.property_id || ""} 
              onValueChange={(value) => onUpdate({ property_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la propiedad donde se alojarán los guests" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      <span>{property.title} - {property.locality}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {properties.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                Primero debes crear una propiedad en la sección "Mi Propiedad"
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

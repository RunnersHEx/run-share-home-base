
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PropertyFormData } from "@/types/property";
import { 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Wind, 
  Coffee,
  Bath,
  Shirt,
  Shield,
  MapPin,
  Trees,
  ShoppingCart,
  Activity
} from "lucide-react";

interface AmenitiesStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  acknowledgedImportantNote: boolean;
  setAcknowledgedImportantNote: (acknowledged: boolean) => void;
}

const AMENITIES = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Estacionamiento", icon: Car },
  { id: "kitchen", label: "Cocina completa", icon: Utensils },
  { id: "pool", label: "Piscina", icon: Waves },
  { id: "air_conditioning", label: "Aire acondicionado/calefacción", icon: Wind },
  { id: "coffee_machine", label: "Cafetera", icon: Coffee },
  { id: "washing_machine", label: "Lavadora", icon: Shirt },
  { id: "public_transport", label: "Cerca de transporte público", icon: MapPin },
  { id: "running_area", label: "Zona segura para correr", icon: Trees },
  { id: "supermarket", label: "Cerca de supermercado", icon: ShoppingCart }
];

const RUNNER_FACILITIES = [
  { id: "stretching_mat", label: "Colchoneta para estirar", icon: Activity },
  { id: "massage_gun", label: "Pistola para auto-masaje", icon: Activity },
  { id: "foam_roller", label: "Roller foam", icon: Activity },
  { id: "resistance_band", label: "Goma larga para estiramientos", icon: Activity },
  { id: "mini_bands", label: "Minibands para fortalecimiento", icon: Activity },
  { id: "golf_ball", label: "Pelota de golf para fascia plantar", icon: Activity }
];

const AmenitiesStep = ({ 
  formData, 
  updateFormData, 
  acknowledgedImportantNote, 
  setAcknowledgedImportantNote 
}: AmenitiesStepProps) => {
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    const currentAmenities = formData.amenities || [];
    
    if (checked) {
      updateFormData({
        amenities: [...currentAmenities, amenityId]
      });
    } else {
      updateFormData({
        amenities: currentAmenities.filter(id => id !== amenityId)
      });
    }
  };

  const handleAcknowledge = () => {
    setAcknowledgedImportantNote(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comodidades que ofreces</CardTitle>
          <p className="text-gray-600">
            Selecciona todas las comodidades disponibles en tu propiedad
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AMENITIES.map((amenity) => {
              const IconComponent = amenity.icon;
              const isChecked = formData.amenities?.includes(amenity.id) || false;
              
              return (
                <div key={amenity.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={amenity.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                  />
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <Label 
                    htmlFor={amenity.id} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {amenity.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Runner Facilities Section */}
      <Card>
        <CardHeader>
          <CardTitle>Facilidades para el corredor</CardTitle>
          <p className="text-gray-600">
            Selecciona las facilidades específicas para runners que tienes disponibles
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RUNNER_FACILITIES.map((facility) => {
              const IconComponent = facility.icon;
              const isChecked = formData.amenities?.includes(facility.id) || false;
              
              return (
                <div key={facility.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={facility.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleAmenityChange(facility.id, checked as boolean)}
                  />
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <Label 
                    htmlFor={facility.id} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {facility.label}
                  </Label>
                </div>
              );
            })}
          </div>

          {/* Important Notice */}
          <div className="mt-8 p-4 bg-orange-100 border-l-4 border-orange-400 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-orange-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Importante
                </h3>
                <p className="mt-1 text-sm text-orange-700">
                  Recuerda que todas aquellas facilidades y espacios que dejes usar a tu Guest en tu casa es bajo tu responsabilidad como Host.
                </p>
                {!acknowledgedImportantNote && (
                  <Button 
                    onClick={handleAcknowledge}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Entendido
                  </Button>
                )}
                {acknowledgedImportantNote && (
                  <div className="mt-2 text-sm text-green-700 font-medium">
                    ✓ Confirmado
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmenitiesStep;

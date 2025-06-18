
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, Thermometer, Wind, ChefHat, Shirt, Car, Mountain, Shield, Coffee, Dumbbell } from "lucide-react";
import { PropertyFormData } from "../PropertyWizard";

interface AmenitiesStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const AMENITY_CATEGORIES = {
  basic: {
    title: "Básico",
    icon: <Wifi className="h-5 w-5" />,
    items: [
      { id: "wifi", name: "WiFi", icon: <Wifi className="h-4 w-4" /> },
      { id: "heating", name: "Calefacción", icon: <Thermometer className="h-4 w-4" /> },
      { id: "air_conditioning", name: "Aire acondicionado", icon: <Wind className="h-4 w-4" /> },
      { id: "kitchen", name: "Cocina", icon: <ChefHat className="h-4 w-4" /> },
      { id: "laundry", name: "Lavandería", icon: <Shirt className="h-4 w-4" /> }
    ]
  },
  runners: {
    title: "Para Runners",
    icon: <Dumbbell className="h-5 w-5" />,
    items: [
      { id: "early_breakfast", name: "Desayuno temprano", icon: <Coffee className="h-4 w-4" /> },
      { id: "stretching_area", name: "Área estiramiento", icon: <Dumbbell className="h-4 w-4" /> }
    ]
  },
  comfort: {
    title: "Comodidad",
    icon: <Car className="h-5 w-5" />,
    items: [
      { id: "parking", name: "Parking", icon: <Car className="h-4 w-4" /> },
      { id: "balcony", name: "Balcón/Terraza", icon: <Mountain className="h-4 w-4" /> },
      { id: "garden", name: "Jardín", icon: <Mountain className="h-4 w-4" /> }
    ]
  },
  location: {
    title: "Ubicación",
    icon: <Mountain className="h-5 w-5" />,
    items: [
      { id: "near_transport", name: "Cerca transporte", icon: <Car className="h-4 w-4" /> },
      { id: "near_parks", name: "Cerca parques/campo/montaña", icon: <Mountain className="h-4 w-4" /> },
      { id: "safe_running", name: "Zona segura para correr", icon: <Shield className="h-4 w-4" /> }
    ]
  }
};

const AmenitiesStep = ({ formData, updateFormData }: AmenitiesStepProps) => {
  const [hasAcceptedResponsibility, setHasAcceptedResponsibility] = useState(false);

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    const updatedAmenities = checked
      ? [...formData.amenities, amenityId]
      : formData.amenities.filter(a => a !== amenityId);
    
    updateFormData({ amenities: updatedAmenities });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Amenities y Comodidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.entries(AMENITY_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey}>
              <div className="flex items-center mb-4">
                {category.icon}
                <h3 className="text-lg font-semibold ml-2">{category.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={item.id}
                      checked={formData.amenities.includes(item.id)}
                      onCheckedChange={(checked) => handleAmenityChange(item.id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <Label htmlFor={item.id} className="font-normal cursor-pointer">
                        {item.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Responsibility Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Importante:</strong> Recuerda que todas aquellas facilidades y espacios que dejes usar a tu Guest en tu casa es bajo tu responsabilidad como Host.
            </AlertDescription>
          </Alert>

          {!hasAcceptedResponsibility && (
            <div className="flex items-center justify-center">
              <Button
                onClick={() => setHasAcceptedResponsibility(true)}
                className="bg-runner-blue-600 hover:bg-runner-blue-700"
              >
                Entendido
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AmenitiesStep;

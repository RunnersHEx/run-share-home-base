
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trophy, AlertTriangle } from "lucide-react";
import { BookingFormData } from "@/types/booking";
import { Race } from "@/types/race";
import { Property } from "@/types/property";

interface BookingSummarySectionProps {
  formData: Partial<BookingFormData>;
  race: Race;
  property: Property;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  userPointsBalance: number;
  calculateStayDuration: () => number;
  formatDate: (dateString: string) => string;
  dynamicPoints?: number;
  originalPoints?: number;
  availabilityChecked?: boolean;
}

export const BookingSummarySection = ({ 
  formData, 
  race, 
  property, 
  agreedToTerms, 
  setAgreedToTerms, 
  userPointsBalance, 
  calculateStayDuration, 
  formatDate,
  dynamicPoints,
  originalPoints,
  availabilityChecked
}: BookingSummarySectionProps) => {
  const finalPoints = dynamicPoints || race.points_cost;
  const hasPointsChanged = dynamicPoints && originalPoints && dynamicPoints !== originalPoints;
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Resumen de la Reserva</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Carrera</p>
            <p className="font-medium">{race.name}</p>
            <p className="text-sm text-gray-500">{formatDate(race.race_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Propiedad</p>
            <p className="font-medium">{property.title}</p>
            <p className="text-sm text-gray-500">{property.locality}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Huéspedes</p>
            <p className="font-medium">{formData.guests_count || 1} {(formData.guests_count || 1) === 1 ? 'huésped' : 'huéspedes'}</p>
          </div>
          {formData.check_in_date && formData.check_out_date && calculateStayDuration() > 0 && (
            <div>
              <p className="text-sm text-gray-600">Estancia</p>
              <p className="font-medium">
                {calculateStayDuration()} {calculateStayDuration() === 1 ? 'noche' : 'noches'}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(formData.check_in_date)} - {formatDate(formData.check_out_date)}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          {/* Availability Status */}
          {formData.check_in_date && formData.check_out_date && (
            <div className="flex items-center justify-between p-2 rounded-lg">
              <span className="text-sm font-medium">Estado de disponibilidad:</span>
              <span className={`text-sm font-medium ${
                availabilityChecked 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`}>
                {availabilityChecked ? '✓ Disponible' : 'Verificando...'}
              </span>
            </div>
          )}
          
          {/* Price Breakdown */}
          <div className="space-y-2">
            {hasPointsChanged && (
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Precio base:</span>
                <span className="line-through">{originalPoints} puntos</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Costo Total:</span>
              <div className="flex items-center space-x-2">
                <span className={`${hasPointsChanged ? 'text-orange-600' : 'text-blue-600'}`}>
                  {finalPoints} puntos
                </span>
                {hasPointsChanged && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    Ajustado por demanda
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Tu balance actual:</span>
              <span className={userPointsBalance >= finalPoints ? 'text-green-600' : 'text-red-600'}>
                {userPointsBalance} puntos
              </span>
            </div>
            
            {userPointsBalance >= finalPoints && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Balance restante:</span>
                <span>{userPointsBalance - finalPoints} puntos</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          />
          <Label htmlFor="terms" className="text-sm">
            Acepto los términos y condiciones y la política de cancelación
          </Label>
        </div>

        {userPointsBalance < finalPoints && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">
              No tienes suficientes puntos para esta reserva. Necesitas {finalPoints - userPointsBalance} puntos más.
            </p>
          </div>
        )}
        
        {!availabilityChecked && formData.check_in_date && formData.check_out_date && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              Verificando disponibilidad en tiempo real...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

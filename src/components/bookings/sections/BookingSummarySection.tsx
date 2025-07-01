
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
}

export const BookingSummarySection = ({ 
  formData, 
  race, 
  property, 
  agreedToTerms, 
  setAgreedToTerms, 
  userPointsBalance, 
  calculateStayDuration, 
  formatDate 
}: BookingSummarySectionProps) => {
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
          {formData.check_in_date && formData.check_out_date && (
            <>
              <div>
                <p className="text-sm text-gray-600">Estancia</p>
                <p className="font-medium">
                  {calculateStayDuration()} {calculateStayDuration() === 1 ? 'noche' : 'noches'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(formData.check_in_date)} - {formatDate(formData.check_out_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="font-medium">{formData.guests_count} {formData.guests_count === 1 ? 'guest' : 'guests'}</p>
              </div>
            </>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Costo Total:</span>
            <span className="text-blue-600">{race.points_cost} puntos</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
            <span>Tu balance actual:</span>
            <span>{userPointsBalance} puntos</span>
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

        {userPointsBalance < race.points_cost && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">
              No tienes suficientes puntos para esta reserva. Necesitas {race.points_cost - userPointsBalance} puntos más.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

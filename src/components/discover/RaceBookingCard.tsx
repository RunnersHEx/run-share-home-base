
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Users } from "lucide-react";

interface RaceBookingCardProps {
  pointsCost: number;
  maxGuests?: number;
  available: boolean;
  onBookingRequest: () => void;
}

export const RaceBookingCard = ({ 
  pointsCost, 
  maxGuests, 
  available, 
  onBookingRequest 
}: RaceBookingCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reservar Experiencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Costo:</span>
          <div className="flex items-center">
            <Trophy className="w-4 h-4 text-[#EA580C] mr-1" />
            <span className="text-lg font-bold text-[#EA580C]">
              {pointsCost} puntos
            </span>
          </div>
        </div>
        
        {maxGuests && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Máx. huéspedes:</span>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 mr-1" />
              <span>{maxGuests}</span>
            </div>
          </div>
        )}

        <Separator />

        <Button 
          onClick={onBookingRequest}
          className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90"
          disabled={!available}
        >
          {available ? 'Solicitar Reserva' : 'No Disponible'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          No se cobrará hasta que el host acepte tu solicitud
        </p>
      </CardContent>
    </Card>
  );
};

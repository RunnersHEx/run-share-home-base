
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Phone } from "lucide-react";
import { BookingFormData } from "@/types/booking";
import { Property } from "@/types/property";
import { Race } from "@/types/race";

interface StayDetailsSectionProps {
  formData: Partial<BookingFormData>;
  setFormData: (data: Partial<BookingFormData> | ((prev: Partial<BookingFormData>) => Partial<BookingFormData>)) => void;
  property: Property;
  race: Race;
}

export const StayDetailsSection = ({ formData, setFormData, property, race }: StayDetailsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Detalles de tu Estancia</span>
        </CardTitle>
        <CardDescription>Define las fechas y detalles de tu visita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="check_in_date">Fecha de Check-in <span className="text-red-500">*</span></Label>
            <input
              id="check_in_date"
              type="date"
              value={formData.check_in_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min={new Date().toISOString().split('T')[0]} // No dates in the past
            />
          </div>
          <div>
            <Label htmlFor="check_out_date">Fecha de Check-out <span className="text-red-500">*</span></Label>
            <input
              id="check_out_date"
              type="date"
              value={formData.check_out_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min={formData.check_in_date || new Date().toISOString().split('T')[0]} // Must be after check-in
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="guests_count">Número de Guests <span className="text-red-500">*</span></Label>
            <select
              id="guests_count"
              value={formData.guests_count || 1}
              onChange={(e) => {
                const guestCount = parseInt(e.target.value, 10);
                setFormData(prev => ({ ...prev, guests_count: guestCount }));
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Array.from({ length: Math.min(property.max_guests, race.max_guests) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Máximo permitido: {Math.min(property.max_guests, race.max_guests)} guests
            </p>
          </div>
          <div>
            <Label htmlFor="estimated_arrival_time">Hora Estimada de Llegada <span className="text-red-500">*</span></Label>
            <input
              id="estimated_arrival_time"
              type="time"
              value={formData.estimated_arrival_time || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_arrival_time: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="guest_phone">Teléfono de Contacto Directo <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="guest_phone"
              type="tel"
              value={formData.guest_phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+34 600 000 000"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

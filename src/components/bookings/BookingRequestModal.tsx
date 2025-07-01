import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, Phone, Clock, MessageSquare, AlertTriangle, Trophy } from "lucide-react";
import { BookingFormData } from "@/types/booking";
import { Race } from "@/types/race";
import { Property } from "@/types/property";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  race: Race;
  property: Property;
}

const BookingRequestModal = ({ isOpen, onClose, onSubmit, race, property }: BookingRequestModalProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    race_id: race.id,
    property_id: property.id,
    host_id: race.host_id,
    guests_count: 1,
    points_cost: race.points_cost,
    request_message: '',
    special_requests: '',
    guest_phone: '',
    estimated_arrival_time: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const calculateStayDuration = () => {
    if (!formData.check_in_date || !formData.check_out_date) return 0;
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData as BookingFormData);
      onClose();
    } catch (error) {
      console.error('Error submitting booking request:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const canSubmit = () => {
    return formData.check_in_date && 
           formData.check_out_date && 
           formData.guests_count && 
           formData.request_message && 
           formData.guest_phone && 
           agreedToTerms;
  };

  const userPointsBalance = profile?.points_balance || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Solicitar Reserva - {race.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1 - Detalles de Estancia */}
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
                  <Label htmlFor="check_in_date">Fecha de Check-in</Label>
                  <input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date || ''}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_date">Fecha de Check-out</Label>
                  <input
                    id="check_out_date"
                    type="date"
                    value={formData.check_out_date || ''}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guests_count">Número de Guests</Label>
                  <select
                    id="guests_count"
                    value={formData.guests_count || 1}
                    onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) })}
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
                  <Label htmlFor="estimated_arrival_time">Hora Estimada de Llegada</Label>
                  <input
                    id="estimated_arrival_time"
                    type="time"
                    value={formData.estimated_arrival_time || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_arrival_time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guest_phone">Teléfono de Contacto Directo</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="guest_phone"
                    type="tel"
                    value={formData.guest_phone || ''}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 600 000 000"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 2 - Mensaje Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Mensaje Personal al Host</span>
              </CardTitle>
              <CardDescription>
                Cuéntale al host sobre ti y por qué quieres vivir esta experiencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.request_message || ''}
                onChange={(e) => setFormData({ ...formData, request_message: e.target.value })}
                placeholder="Cuéntale al host sobre ti: ¿Por qué quieres correr esta carrera? ¿Qué esperas de la experiencia? ¿Cuál es tu experiencia en running? ¿Tienes alguna pregunta específica?"
                className="min-h-[120px]"
                maxLength={500}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {(formData.request_message || '').length}/500 caracteres
              </p>
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-medium mb-1">Sugerencias de qué incluir:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tu experiencia en running y por qué te apasiona</li>
                  <li>Motivación específica para esta carrera</li>
                  <li>Qué esperas aprender de la experiencia local</li>
                  <li>Preguntas sobre la carrera o la zona</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sección 3 - Solicitudes Especiales */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Especiales</CardTitle>
              <CardDescription>Información adicional que el host debería conocer</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.special_requests || ''}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                placeholder="Ej: Restricciones dietéticas, necesidad de desayuno temprano, solicitud de transporte, alergias, etc."
                className="min-h-[80px]"
                maxLength={300}
              />
              <p className="text-sm text-gray-500 mt-2">
                {(formData.special_requests || '').length}/300 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Sección 4 - Resumen y Confirmación */}
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

          {/* Botones de Acción */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit() || loading || userPointsBalance < race.points_cost}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestModal;

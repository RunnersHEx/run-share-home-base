
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookingFormData } from "@/types/booking";
import { Race } from "@/types/race";
import { Property } from "@/types/property";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { PointsCalculationService } from "@/services/pointsCalculationService";
import { StayDetailsSection } from "./sections/StayDetailsSection";
import { MessageSection } from "./sections/MessageSection";
import { SpecialRequestsSection } from "./sections/SpecialRequestsSection";
import { BookingSummarySection } from "./sections/BookingSummarySection";
import { AlertTriangle, CheckCircle, Loader2, Shield, Star } from "lucide-react";
import { toast } from "sonner";

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  race: Race;
  property: Property;
}

const BookingRequestModal = ({ isOpen, onClose, onSubmit, race, property }: BookingRequestModalProps) => {
  const { user, profile: authProfile, isVerified } = useAuth();
  const { profile: useProfileData } = useProfile();
  
  // ✅ SMART FALLBACK: Use AuthContext data when useProfile fails
  const profile = useMemo(() => {
    const hasValidProfileData = useProfileData && useProfileData.id && (useProfileData.first_name || useProfileData.last_name || useProfileData.email);
    const selectedProfile = hasValidProfileData ? useProfileData : authProfile;
    

    
    return selectedProfile;
  }, [useProfileData, authProfile]);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [preChecksPassed, setPreChecksPassed] = useState(false);
  const [preCheckErrors, setPreCheckErrors] = useState<string[]>([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [dynamicPoints, setDynamicPoints] = useState(race.points_cost);
  const [formData, setFormData] = useState<Partial<BookingFormData>>(() => ({
    race_id: race.id,
    property_id: property.id,
    host_id: race.host_id,
    guests_count: 1,
    points_cost: race.points_cost,
    request_message: '',
    special_requests: '',
    guest_phone: '',
    estimated_arrival_time: '',
    check_in_date: '',
    check_out_date: ''
  }));
  

  
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validaciones previas y verificaciones
  const runPreChecks = async () => {
    if (!user || !profile) return;
    
    const errors: string[] = [];
    
    // 1. Verificar perfil completo
    if (!profile.first_name || !profile.last_name) {
      errors.push('Completa tu nombre en el perfil');
    }
    
    if (!profile.phone) {
      errors.push('Agrega un número de teléfono a tu perfil');
    }
    
    if (!profile.bio || profile.bio.length < 50) {
      errors.push('Agrega una biografía de al menos 50 caracteres');
    }
    
    // 2. Verificar estado de verificación - Use AuthContext isVerified as primary check
    const userIsVerified = isVerified || profile?.verification_status === 'approved' || profile?.verification_status === 'verified';
    if (!userIsVerified) {
      errors.push('Tu perfil debe estar verificado para hacer reservas');
    }
    
    // 3. Verificar balance de puntos
    const userPointsBalance = profile.points_balance || 0;
    if (userPointsBalance < dynamicPoints) {
      errors.push(`No tienes suficientes puntos. Necesitas ${dynamicPoints}, tienes ${userPointsBalance}`);
    }
    
    setPreCheckErrors(errors);
    setPreChecksPassed(errors.length === 0);
  };
  
  const checkRealTimeAvailability = async () => {
    if (!formData.check_in_date || !formData.check_out_date) return;
    
    // Validate dates are complete and valid
    if (formData.check_in_date.length !== 10 || formData.check_out_date.length !== 10) {
      setAvailabilityChecked(false);
      return;
    }
    
    setValidationLoading(true);
    try {
      // Verificar disponibilidad y recalcular puntos dinámicamente
      const calculatedPoints = await PointsCalculationService.calculateBookingPoints({
        propertyId: property.id,
        raceId: race.id,
        checkInDate: formData.check_in_date,
        checkOutDate: formData.check_out_date
      });
      
      setDynamicPoints(calculatedPoints);
      setFormData(prev => ({ ...prev, points_cost: calculatedPoints }));
      setAvailabilityChecked(true);
      toast.success('✅ Disponibilidad confirmada - Fechas disponibles');
    } catch (error: any) {
      const errorMessage = error.message || 'Error verificando disponibilidad';
      
      if (errorMessage.includes('ya no están disponibles')) {
        toast.error('❌ Las fechas seleccionadas ya están ocupadas o bloqueadas');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
      
      setAvailabilityChecked(false);
    } finally {
      setValidationLoading(false);
    }
  };
  
  const calculateStayDuration = () => {
    if (!formData.check_in_date || !formData.check_out_date) return 0;
    
    // Ensure we have valid date strings
    const checkInStr = formData.check_in_date;
    const checkOutStr = formData.check_out_date;
    
    if (!checkInStr || !checkOutStr) return 0;
    
    // Only calculate if both dates are complete (10 characters: YYYY-MM-DD)
    if (checkInStr.length !== 10 || checkOutStr.length !== 10) {
      return 0;
    }
    
    // Parse dates safely
    const checkIn = new Date(checkInStr + 'T00:00:00');
    const checkOut = new Date(checkOutStr + 'T00:00:00');
    
    // Validate dates
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      console.error('Invalid dates:', { checkInStr, checkOutStr });
      return 0;
    }
    
    // Calculate difference in days
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    

    
    return Math.max(0, diffDays); // Ensure non-negative result
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    // Validate required fields
    if (!formData.check_in_date || !formData.check_out_date || !formData.request_message || !formData.guest_phone) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validate date logic
    const checkIn = new Date(formData.check_in_date + 'T00:00:00');
    const checkOut = new Date(formData.check_out_date + 'T00:00:00');
    
    if (checkOut <= checkIn) {
      toast.error('La fecha de check-out debe ser posterior a la de check-in');
      return;
    }


    setLoading(true);
    try {
      const result = await onSubmit(formData as BookingFormData);

      if (result) {
        toast.success('Solicitud de reserva enviada correctamente');
        onClose();
      }
    } catch (error) {
      toast.error('Error al enviar la solicitud de reserva');
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
    return preChecksPassed &&
           availabilityChecked &&
           formData.check_in_date && 
           formData.check_out_date && 
           formData.guests_count && 
           formData.request_message && 
           formData.guest_phone && 
           agreedToTerms;
  };

  const userPointsBalance = profile?.points_balance || 0;
  
  // Ejecutar pre-checks cuando se abra el modal
  useEffect(() => {
    if (isOpen && user && profile) {
      runPreChecks();
    }
  }, [isOpen, user, profile, dynamicPoints]);
  
  // Verificar disponibilidad cuando cambien las fechas
  useEffect(() => {
    // Only check availability if both dates are complete (10 characters each)
    if (formData.check_in_date && formData.check_out_date && 
        formData.check_in_date.length === 10 && formData.check_out_date.length === 10) {
      const timeoutId = setTimeout(() => {
        checkRealTimeAvailability();
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset availability if dates are incomplete
      setAvailabilityChecked(false);
    }
  }, [formData.check_in_date, formData.check_out_date]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Solicitar Reserva - {race.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para solicitar una reserva de alojamiento para la carrera {race.name}
          </DialogDescription>
        </DialogHeader>

        {/* Pre-checks Status */}
        <div className="space-y-3">
          {preCheckErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-1">
                  <p className="font-medium">Requisitos pendientes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {preCheckErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {preChecksPassed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center space-x-2">
                  <span>✓ Todos los requisitos verificados</span>
                  {(isVerified || profile?.verification_status === 'approved' || profile?.verification_status === 'verified') && <Shield className="h-4 w-4" />}
                  {profile?.average_rating && profile.average_rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{profile.average_rating}</span>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {validationLoading && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                Verificando disponibilidad y calculando puntos...
              </AlertDescription>
            </Alert>
          )}
          
          {availabilityChecked && dynamicPoints !== race.points_cost && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <p className="font-medium">Precio ajustado por demanda</p>
                <p className="text-sm">Los puntos se han actualizado de {race.points_cost} a {dynamicPoints} basado en la demanda actual.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <StayDetailsSection 
            formData={formData}
            setFormData={setFormData}
            property={property}
            race={race}
          />

          <MessageSection 
            formData={formData}
            setFormData={setFormData}
          />

          <SpecialRequestsSection 
            formData={formData}
            setFormData={setFormData}
          />

          <BookingSummarySection
            key={`summary-${formData.guests_count}-${formData.check_in_date}-${formData.check_out_date}`}
            formData={formData}
            race={race}
            property={property}
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
            userPointsBalance={userPointsBalance}
            calculateStayDuration={calculateStayDuration}
            formatDate={formatDate}
            dynamicPoints={dynamicPoints}
            originalPoints={race.points_cost}
            availabilityChecked={availabilityChecked}
          />

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit() || loading || userPointsBalance < dynamicPoints}
              className={`${preChecksPassed && availabilityChecked ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
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

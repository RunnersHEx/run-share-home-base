
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingFormData } from "@/types/booking";
import { Race } from "@/types/race";
import { Property } from "@/types/property";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { StayDetailsSection } from "./sections/StayDetailsSection";
import { MessageSection } from "./sections/MessageSection";
import { SpecialRequestsSection } from "./sections/SpecialRequestsSection";
import { BookingSummarySection } from "./sections/BookingSummarySection";

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
            formData={formData}
            race={race}
            property={property}
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
            userPointsBalance={userPointsBalance}
            calculateStayDuration={calculateStayDuration}
            formatDate={formatDate}
          />

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

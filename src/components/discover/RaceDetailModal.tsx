
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RaceDetailContent } from "./RaceDetailContent";
import { RaceHostCard } from "./RaceHostCard";
import { RaceBookingCard } from "./RaceBookingCard";
import { useRaceBooking } from "@/hooks/useRaceBooking";
import BookingRequestModal from "@/components/bookings/BookingRequestModal";

interface RaceDetailModalProps {
  race: {
    id: string;
    name: string;
    location: string;
    date: string;
    daysUntil: number;
    modalities: string[];
    distances: string[];
    terrainProfile: string[];
    imageUrl: string;
    host: {
      id: string;
      name: string;
      rating: number;
      verified: boolean;
      imageUrl: string;
    };
    pointsCost: number;
    available: boolean;
    highlights: string;
    maxGuests?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const RaceDetailModal = ({ race, isOpen, onClose }: RaceDetailModalProps) => {
  const {
    showBookingModal,
    setShowBookingModal,
    handleBookingRequest,
    handleBookingSubmit,
    raceForBooking,
    propertyForBooking
  } = useRaceBooking(race);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{race.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalles de la carrera {race.name} en {race.location}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="md:col-span-2">
              <RaceDetailContent race={race} />
            </div>

            {/* Sidebar - Host y reserva */}
            <div className="space-y-6">
              <RaceHostCard host={race.host} />
              <RaceBookingCard 
                pointsCost={race.pointsCost}
                maxGuests={race.maxGuests}
                available={race.available}
                onBookingRequest={handleBookingRequest}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de solicitud de reserva */}
      {showBookingModal && (
        <BookingRequestModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBookingSubmit}
          race={raceForBooking}
          property={propertyForBooking}
        />
      )}
    </>
  );
};


import { useState } from "react";
import { Race } from "@/types/race";
import { Property } from "@/types/property";
import { BookingFormData } from "@/types/booking";
import { useBookings } from "@/hooks/useBookings";
import { toast } from "sonner";

interface DiscoverRace {
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
}

export const useRaceBooking = (race: DiscoverRace) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { createBookingRequest } = useBookings();

  const handleBookingRequest = () => {
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData: BookingFormData) => {
    try {
      // Call the actual booking service to create the request
      const result = await createBookingRequest(bookingData);
      
      if (result) {
        setShowBookingModal(false);
        return result;
      } else {
        throw new Error('Failed to create booking request');
      }
    } catch (error) {
      throw error; // Re-throw so the modal can handle the error
    }
  };

  // For booking, we need to use the host's actual property
  // Since the race data doesn't include property_id, we'll use the host_id as the property owner
  // and let the backend handle the property lookup
  const raceForBooking: Race = {
    id: race.id,
    host_id: race.host.id,
    property_id: race.host.id, // Temporary - backend should resolve this to actual property
    name: race.name,
    description: race.highlights,
    race_date: race.date,
    registration_deadline: race.date,
    modalities: race.modalities as any[],
    terrain_profile: race.terrainProfile as any[],
    distances: race.distances as any[],
    has_wave_starts: false,
    start_location: race.location,
    distance_from_property: 0,
    official_website: '',
    registration_cost: 0,
    points_cost: race.pointsCost,
    max_guests: race.maxGuests || 1,
    highlights: race.highlights,
    local_tips: '',
    weather_notes: '',
    is_active: race.available,
    total_bookings: 0,
    average_rating: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Use the host's property - backend should resolve this
  const propertyForBooking: Property = {
    id: race.host.id, // Will be resolved to actual property by backend
    owner_id: race.host.id,
    title: `Alojamiento en ${race.location}`,
    description: `Alojamiento disponible para la carrera ${race.name}`,
    provinces: [race.location],
    locality: race.location,
    full_address: race.location,
    latitude: null,
    longitude: null,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    max_guests: race.maxGuests || 1,
    amenities: [],
    house_rules: null,
    check_in_instructions: null,
    runner_instructions: null,
    cancellation_policy: 'flexible',
    is_active: true,
    approval_status: 'approved',
    total_bookings: 0,
    average_rating: 0,
    points_earned: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return {
    showBookingModal,
    setShowBookingModal,
    handleBookingRequest,
    handleBookingSubmit,
    raceForBooking,
    propertyForBooking
  };
};


import { useState } from "react";
import { Race } from "@/types/race";
import { Property } from "@/types/property";

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

  const handleBookingRequest = () => {
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    console.log('Booking request submitted:', bookingData);
    setShowBookingModal(false);
  };

  // Transform our race data to match the expected Race type with ALL required properties
  const raceForBooking: Race = {
    id: race.id,
    host_id: race.host.id,
    property_id: `property_${race.host.id}`,
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

  // Mock property data with ALL required properties including optional approval_status
  const propertyForBooking: Property = {
    id: `property_${race.host.id}`,
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
    approval_status: 'approved', // Add the optional field
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

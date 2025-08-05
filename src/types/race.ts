
export interface Race {
  id: string;
  host_id: string;
  property_id: string;
  name: string;
  description?: string;
  province: string;
  race_date: string;
  registration_deadline?: string;
  modalities: RaceModality[];
  terrain_profile: TerrainProfile[];
  distances: RaceDistance[];
  has_wave_starts: boolean;
  distance_from_property?: number;
  official_website?: string;
  registration_cost?: number;
  points_cost: number;
  max_guests: number;
  highlights?: string;
  local_tips?: string;
  weather_notes?: string;
  is_active: boolean;
  total_bookings: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
  // Joined data from queries
  host_info?: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    verification_status: string;
    average_rating?: number;
  };
  property_info?: {
    id: string;
    title: string;
    description: string | null;
    locality: string;
    provinces: string[];
    full_address: string;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    max_guests: number;
    amenities: string[];
    house_rules: string | null;
    runner_instructions?: string | null;
    images?: {
      id: string;
      image_url: string;
      caption: string | null;
      is_main: boolean;
      display_order: number;
    }[];
  };
}

export interface RaceImage {
  id: string;
  race_id: string;
  image_url: string;
  category: RaceImageCategory;
  caption?: string;
  display_order: number;
  created_at: string;
}

export type RaceModality = 'road' | 'trail';
export type TerrainProfile = 'hilly' | 'flat';
export type RaceDistance = 'ultra' | 'marathon' | 'half_marathon' | '20k' | '15k' | '10k' | '5k';
export type RaceImageCategory = 'cover' | 'route' | 'elevation' | 'landscape' | 'finish' | 'atmosphere';

export interface RaceFormData {
  name: string;
  description?: string;
  province: string;
  race_date: string;
  registration_deadline?: string;
  property_id: string;
  modalities: RaceModality[];
  terrain_profile: TerrainProfile[];
  distances: RaceDistance[];
  has_wave_starts: boolean;
  distance_from_property?: number;
  official_website?: string;
  registration_cost?: number;
  points_cost: number;
  max_guests: number;
  highlights?: string;
  local_tips?: string;
  weather_notes?: string;
}

export interface RaceFilters {
  month?: string;
  modality?: RaceModality;
  modalities?: RaceModality[];
  distance?: RaceDistance;
  distances?: RaceDistance[];
  status?: 'active' | 'inactive';
  province?: string;
  maxGuests?: number;
  terrainProfiles?: TerrainProfile[];
}

export interface RaceStats {
  totalRaces: number;
  bookingsThisYear: number;
  averageRating: number;
}


export interface Race {
  id: string;
  host_id: string;
  property_id: string;
  name: string;
  description?: string;
  race_date: string;
  registration_deadline?: string;
  modalities: RaceModality[];
  terrain_profile: TerrainProfile[];
  distances: RaceDistance[];
  has_wave_starts: boolean;
  start_location?: string;
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
export type RaceImageCategory = 'route' | 'elevation' | 'landscape' | 'finish' | 'atmosphere';

export interface RaceFormData {
  name: string;
  description?: string;
  race_date: string;
  registration_deadline?: string;
  property_id: string;
  modalities: RaceModality[];
  terrain_profile: TerrainProfile[];
  distances: RaceDistance[];
  has_wave_starts: boolean;
  start_location?: string;
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
  distance?: RaceDistance;
  status?: 'active' | 'inactive';
}

export interface RaceStats {
  totalRaces: number;
  bookingsThisYear: number;
  averageRating: number;
}


export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  provinces: string[];
  locality: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  house_rules: string | null;
  check_in_instructions: string | null;
  runner_instructions: string | null;
  cancellation_policy: string;
  is_active: boolean;
  approval_status: string;
  total_bookings: number;
  average_rating: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_main: boolean;
  created_at: string;
}

export interface PropertyFormData {
  title: string;
  description: string | null;
  provinces: string[];
  locality: string;
  full_address: string;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  house_rules: string | null;
  check_in_instructions: string | null;
  runner_instructions: string | null;
  cancellation_policy: string;
}


export interface Booking {
  id: string;
  race_id: string;
  guest_id: string;
  host_id: string;
  property_id: string;
  
  // Detalles de estancia
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  
  // Comunicación
  request_message?: string;
  special_requests?: string;
  guest_phone?: string;
  estimated_arrival_time?: string;
  host_response_message?: string;
  
  // Gestión
  points_cost: number;
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled';
  
  // Deadlines
  host_response_deadline: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  rejected_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Relaciones expandidas
  race?: {
    name: string;
    race_date: string;
    start_location?: string;
  };
  guest?: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    verification_status: string;
    average_rating: number;
  };
  host?: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    verification_status: string;
    average_rating: number;
  };
  property?: {
    title: string;
    locality: string;
    max_guests: number;
  };
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at?: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  type: 'booking_payment' | 'booking_earning' | 'booking_refund' | 'subscription_bonus';
  description?: string;
  created_at: string;
}

export interface BookingFormData {
  race_id: string;
  property_id: string;
  host_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  request_message: string;
  special_requests?: string;
  guest_phone: string;
  estimated_arrival_time?: string;
  points_cost: number;
}

export interface BookingFilters {
  status?: string;
  date_range?: 'upcoming' | 'past' | 'current';
  role?: 'guest' | 'host';
}

export interface BookingStats {
  totalBookings: number;
  pendingRequests: number;
  completedBookings: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  averageResponseTime: number;
  acceptanceRate: number;
}


export interface PropertyAvailability {
  id: string;
  property_id: string;
  date: string;
  status: 'available' | 'blocked' | 'reserved';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityFormData {
  dates: string[];
  status: 'available' | 'blocked';
  notes?: string;
}

export interface CalendarDay {
  date: Date;
  dateString: string;
  status: 'available' | 'blocked' | 'reserved' | 'past' | 'unavailable';
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  notes?: string;
}

export interface CalendarSettings {
  minAdvanceDays: number;
  maxAdvanceDays: number;
  minNights: number;
  maxNights: number;
}

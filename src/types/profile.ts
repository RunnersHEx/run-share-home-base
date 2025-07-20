export type RunningExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'elite';

export type RunningModality = 
  | 'road_running' 
  | 'trail_running' 
  | 'track_running' 
  | 'marathon' 
  | 'half_marathon' 
  | '10k' 
  | '5k' 
  | 'ultra_marathon' 
  | 'obstacle_race';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  bio: string | null;
  running_experience: RunningExperience | null;
  preferred_distances: string[] | null;
  running_modalities: string[] | null;
  personal_records: Record<string, string> | null;
  races_completed_this_year: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_host: boolean;
  is_guest: boolean;
  verification_status: VerificationStatus;
  verification_documents: string[] | null;
  total_host_experiences: number;
  total_guest_experiences: number;
  average_rating: number;
  badges: string[] | null;
  points_balance: number;
  profile_image_url: string | null;
}

export interface RunnerExperienceOption {
  value: RunningExperience;
  label: string;
}

export const RUNNING_EXPERIENCE_OPTIONS: RunnerExperienceOption[] = [
  { value: 'beginner', label: 'Principiante (menos de 1 año)' },
  { value: 'intermediate', label: 'Intermedio (1-3 años)' },
  { value: 'advanced', label: 'Avanzado (3-5 años)' },
  { value: 'expert', label: 'Experto (5+ años)' },
  { value: 'elite', label: 'Elite (competitivo/profesional)' },
];

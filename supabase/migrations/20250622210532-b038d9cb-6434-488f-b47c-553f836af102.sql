
-- Añadir las columnas que faltan en la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS running_modalities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personal_records jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS races_completed_this_year integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_host boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_documents text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_host_experiences integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_guest_experiences integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS points_balance integer DEFAULT 0;

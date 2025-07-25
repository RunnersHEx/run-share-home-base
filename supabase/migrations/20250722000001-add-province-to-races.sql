-- Add province column to races table
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT '';

-- Create index for province filtering
CREATE INDEX IF NOT EXISTS idx_races_province ON public.races(province) WHERE is_active = true;

-- Update existing races to have a default province (you may want to update these manually later)
UPDATE public.races SET province = 'Sin especificar' WHERE province = '' OR province IS NULL;

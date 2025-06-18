
-- Create races table
CREATE TABLE public.races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  race_date DATE NOT NULL,
  registration_deadline DATE,
  modalities JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['road', 'trail']
  terrain_profile JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['hilly', 'flat']
  distances JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['marathon', 'half_marathon', '10k', etc]
  has_wave_starts BOOLEAN NOT NULL DEFAULT false,
  start_location TEXT,
  distance_from_property NUMERIC, -- in kilometers
  official_website TEXT,
  registration_cost NUMERIC, -- in euros
  points_cost INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER NOT NULL DEFAULT 1,
  highlights TEXT,
  local_tips TEXT,
  weather_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT race_date_future CHECK (race_date > CURRENT_DATE),
  CONSTRAINT registration_deadline_before_race CHECK (registration_deadline IS NULL OR registration_deadline <= race_date)
);

-- Create race_images table
CREATE TABLE public.race_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('route', 'elevation', 'landscape', 'finish', 'atmosphere')),
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on races table
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- Enable RLS on race_images table
ALTER TABLE public.race_images ENABLE ROW LEVEL SECURITY;

-- Policies for races table
CREATE POLICY "Hosts can manage their own races" ON public.races
  FOR ALL USING (host_id = auth.uid());

CREATE POLICY "Anyone can view active races" ON public.races
  FOR SELECT USING (is_active = true);

-- Policies for race_images table
CREATE POLICY "Hosts can manage their race images" ON public.race_images
  FOR ALL USING (
    race_id IN (
      SELECT id FROM public.races WHERE host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view images of active races" ON public.race_images
  FOR SELECT USING (
    race_id IN (
      SELECT id FROM public.races WHERE is_active = true
    )
  );

-- Create triggers to update updated_at column
CREATE TRIGGER update_races_updated_at
    BEFORE UPDATE ON public.races
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_races_host_id ON public.races(host_id);
CREATE INDEX idx_races_property_id ON public.races(property_id);
CREATE INDEX idx_races_date ON public.races(race_date);
CREATE INDEX idx_races_active ON public.races(is_active);
CREATE INDEX idx_race_images_race_id ON public.race_images(race_id);
CREATE INDEX idx_race_images_category ON public.race_images(category);

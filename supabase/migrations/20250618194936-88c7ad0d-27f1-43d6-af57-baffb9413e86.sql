
-- Create property_availability table
CREATE TABLE public.property_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'blocked', 'reserved')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Enable RLS on property_availability
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

-- Policies for property_availability table
CREATE POLICY "Property owners can manage their availability" ON public.property_availability
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view availability of active properties" ON public.property_availability
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM public.properties WHERE is_active = true
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_property_availability_updated_at
    BEFORE UPDATE ON public.property_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_property_availability_property_date ON public.property_availability(property_id, date);
CREATE INDEX idx_property_availability_date ON public.property_availability(date);

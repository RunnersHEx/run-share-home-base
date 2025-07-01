
-- Crear tabla de reviews para bookings
CREATE TABLE public.booking_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('host_to_guest', 'guest_to_host')),
  categories JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view public reviews" 
  ON public.booking_reviews 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view reviews where they are involved" 
  ON public.booking_reviews 
  FOR SELECT 
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "Users can create reviews for their bookings" 
  ON public.booking_reviews 
  FOR INSERT 
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (guest_id = auth.uid() OR host_id = auth.uid())
      AND status = 'completed'
    )
  );

-- Índices para optimizar consultas
CREATE INDEX idx_booking_reviews_reviewee_id ON public.booking_reviews(reviewee_id);
CREATE INDEX idx_booking_reviews_booking_id ON public.booking_reviews(booking_id);
CREATE INDEX idx_booking_reviews_created_at ON public.booking_reviews(created_at DESC);

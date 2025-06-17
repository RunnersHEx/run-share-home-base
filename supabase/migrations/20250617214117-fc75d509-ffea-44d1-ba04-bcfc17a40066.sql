
-- Enable RLS on tables that don't have it yet
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Houses table policies
CREATE POLICY "Anyone can view active houses" ON public.houses
  FOR SELECT USING (is_active = true);

CREATE POLICY "House owners can view their houses" ON public.houses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "House owners can update their houses" ON public.houses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "House owners can insert houses" ON public.houses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "House owners can delete their houses" ON public.houses
  FOR DELETE USING (auth.uid() = owner_id);

-- Swap requests table policies
CREATE POLICY "Requesters can view their requests" ON public.swap_requests
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "House owners can view requests for their houses" ON public.swap_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.houses 
      WHERE id = requested_house_id
    )
  );

CREATE POLICY "Requesters can create swap requests" ON public.swap_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their requests" ON public.swap_requests
  FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "House owners can update requests for their houses" ON public.swap_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.houses 
      WHERE id = requested_house_id
    )
  );

-- Reviews table policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Reviewers can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

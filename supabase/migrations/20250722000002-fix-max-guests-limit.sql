-- Fix existing races that have max_guests > 4
-- Update any races with max_guests greater than 4 to have max_guests = 4
UPDATE public.races 
SET max_guests = 4 
WHERE max_guests > 4;

-- Add a check constraint to ensure max_guests cannot exceed 4 for future inserts/updates
ALTER TABLE public.races 
ADD CONSTRAINT races_max_guests_limit 
CHECK (max_guests >= 1 AND max_guests <= 4);

-- Fix the booking_reviews unique constraint issue
-- Drop the existing unique constraint on booking_id alone
-- Add a new unique constraint on booking_id + reviewer_id combination

-- First, check if the unique constraint exists and drop it
DO $$ 
BEGIN
    -- Drop the unique constraint on booking_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'booking_reviews_booking_id_key'
    ) THEN
        ALTER TABLE booking_reviews DROP CONSTRAINT booking_reviews_booking_id_key;
    END IF;
    
    -- Drop any other unique constraints that might conflict
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'booking_reviews_booking_id_fkey' 
        AND contype = 'u'
    ) THEN
        ALTER TABLE booking_reviews DROP CONSTRAINT booking_reviews_booking_id_fkey;
    END IF;
END $$;

-- Create a new unique constraint that allows both host and guest to review the same booking
-- but prevents the same reviewer from reviewing the same booking multiple times
ALTER TABLE booking_reviews 
ADD CONSTRAINT booking_reviews_booking_reviewer_unique 
UNIQUE (booking_id, reviewer_id);

-- Also make sure we have the proper foreign key constraint (not unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'booking_reviews_booking_id_fkey' 
        AND contype = 'f'
    ) THEN
        ALTER TABLE booking_reviews 
        ADD CONSTRAINT booking_reviews_booking_id_fkey 
        FOREIGN KEY (booking_id) REFERENCES bookings(id);
    END IF;
END $$;

-- Add some helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_reviews_reviewee_id ON booking_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_reviewer_id ON booking_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_booking_id ON booking_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reviews_created_at ON booking_reviews(created_at DESC);

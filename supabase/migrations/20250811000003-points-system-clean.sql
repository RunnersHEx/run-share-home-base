-- Points System Implementation - Clean Migration
-- This migration implements the complete points system according to requirements

-- First, create the provincial points table
CREATE TABLE IF NOT EXISTS public.provincial_point_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  province text NOT NULL UNIQUE,
  points_per_night integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert provincial point costs (exact values from requirements document)
INSERT INTO public.provincial_point_costs (province, points_per_night) VALUES
  ('Álava', 20),
  ('Albacete', 30),
  ('Alicante', 30),
  ('Almería', 30),
  ('Asturias', 30),
  ('Ávila', 20),
  ('Badajoz', 20),
  ('Barcelona', 60),
  ('Burgos', 30),
  ('Cáceres', 30),
  ('Cádiz', 30),
  ('Cantabria', 30),
  ('Castellón', 40),
  ('Ciudad Real', 20),
  ('Córdoba', 30),
  ('Cuenca', 20),
  ('Girona', 30),
  ('Granada', 30),
  ('Guadalajara', 20),
  ('Guipúzcoa', 20),
  ('Huelva', 20),
  ('Huesca', 20),
  ('Illes Balears', 20),
  ('Jaén', 20),
  ('A Coruña', 30),
  ('La Rioja', 20),
  ('Las Palmas', 30),
  ('León', 20),
  ('Lleida', 20),
  ('Lugo', 20),
  ('Madrid', 60),
  ('Málaga', 60),
  ('Murcia', 40),
  ('Navarra', 20),
  ('Ourense', 20),
  ('Palencia', 20),
  ('Pontevedra', 30),
  ('Salamanca', 30),
  ('Santa Cruz de Tenerife', 30),
  ('Segovia', 20),
  ('Sevilla', 60),
  ('Soria', 20),
  ('Tarragona', 40),
  ('Teruel', 20),
  ('Toledo', 30),
  ('Valencia', 60),
  ('Valladolid', 20),
  ('Vizcaya', 20),
  ('Zamora', 20),
  ('Zaragoza', 40)
ON CONFLICT (province) DO UPDATE SET 
  points_per_night = EXCLUDED.points_per_night,
  updated_at = now();

-- 1. Function to get provincial points per night
CREATE OR REPLACE FUNCTION get_provincial_points_per_night(p_province text)
RETURNS integer AS $$
DECLARE
  result integer;
BEGIN
  SELECT points_per_night INTO result
  FROM provincial_point_costs 
  WHERE province = p_province;
  
  -- Return default value if province not found
  IF result IS NULL THEN
    RETURN 30;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to calculate race booking cost (replaces dynamic calculation)
CREATE OR REPLACE FUNCTION calculate_race_booking_cost(
  p_race_id uuid,
  p_check_in_date date,
  p_check_out_date date
)
RETURNS integer AS $$
DECLARE
  race_province text;
  points_per_night integer;
  nights_count integer;
  total_cost integer;
BEGIN
  -- Get the province from the race
  SELECT province INTO race_province
  FROM races
  WHERE id = p_race_id;
  
  -- If race province is null or empty, try to get from property
  IF race_province IS NULL OR race_province = '' THEN
    SELECT CASE 
      WHEN p.provinces IS NOT NULL AND array_length(p.provinces, 1) > 0 
      THEN p.provinces[1] 
      ELSE NULL 
    END INTO race_province
    FROM races r
    JOIN properties p ON r.property_id = p.id
    WHERE r.id = p_race_id;
  END IF;
  
  -- If still no province found, use default
  IF race_province IS NULL OR race_province = '' THEN
    race_province := 'Madrid'; -- Default to Madrid if no province found
  END IF;
  
  -- Get points per night for this province
  points_per_night := get_provincial_points_per_night(race_province);
  
  -- Calculate number of nights
  nights_count := p_check_out_date - p_check_in_date;
  
  IF nights_count <= 0 THEN
    RAISE EXCEPTION 'Invalid date range: check-out must be after check-in';
  END IF;
  
  -- Calculate total cost
  total_cost := nights_count * points_per_night;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enhanced booking payment processing function
CREATE OR REPLACE FUNCTION process_booking_with_provincial_points(
  p_booking_id UUID,
  p_guest_id UUID,
  p_host_id UUID,
  p_race_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE
) RETURNS INTEGER AS $$
DECLARE
  calculated_cost INTEGER;
  guest_balance INTEGER;
BEGIN
  -- Calculate cost based on province
  calculated_cost := calculate_race_booking_cost(p_race_id, p_check_in_date, p_check_out_date);
  
  -- Check if guest has sufficient points
  SELECT points_balance INTO guest_balance
  FROM profiles 
  WHERE id = p_guest_id;
  
  IF guest_balance < calculated_cost THEN
    RAISE EXCEPTION 'Insufficient points balance. Required: %, Available: %', calculated_cost, guest_balance;
  END IF;
  
  -- Deduct points from guest
  UPDATE profiles 
  SET points_balance = points_balance - calculated_cost 
  WHERE id = p_guest_id;
  
  -- Add points to host
  UPDATE profiles 
  SET points_balance = points_balance + calculated_cost 
  WHERE id = p_host_id;
  
  -- Record transactions
  INSERT INTO points_transactions (user_id, booking_id, amount, type, description) VALUES
    (p_guest_id, p_booking_id, -calculated_cost, 'booking_payment', 'Payment for booking'),
    (p_host_id, p_booking_id, calculated_cost, 'booking_earning', 'Earnings from hosting');
  
  RETURN calculated_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to award hosting points (40 points per night)
CREATE OR REPLACE FUNCTION award_hosting_points()
RETURNS TRIGGER AS $$
DECLARE
  nights_count integer;
  total_points integer;
BEGIN
  -- Only process when booking is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate number of nights
    nights_count := NEW.check_out_date - NEW.check_in_date;
    
    -- Award 40 points per night to the host
    total_points := nights_count * 40;
    
    -- Update host's points balance
    UPDATE profiles 
    SET points_balance = points_balance + total_points 
    WHERE id = NEW.host_id;
    
    -- Record the transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.host_id, 
      NEW.id, 
      total_points, 
      'booking_earning', 
      CONCAT('Hosting reward: ', nights_count, ' nights × 40 points')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to award property points (30 points)
CREATE OR REPLACE FUNCTION award_property_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 30 points when a property is created
  UPDATE profiles 
  SET points_balance = points_balance + 30 
  WHERE id = NEW.owner_id;
  
  -- Record the transaction
  INSERT INTO points_transactions (user_id, amount, type, description)
  VALUES (
    NEW.owner_id, 
    30, 
    'subscription_bonus', 
    'Added new property: ' || COALESCE(NEW.title, 'Untitled Property')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to award race points (40 points)
CREATE OR REPLACE FUNCTION award_race_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure race is linked to a property
  IF NEW.property_id IS NULL THEN
    RAISE EXCEPTION 'Race must be linked to a property';
  END IF;
  
  -- Award 40 points when a race is created
  UPDATE profiles 
  SET points_balance = points_balance + 40 
  WHERE id = NEW.host_id;
  
  -- Record the transaction
  INSERT INTO points_transactions (user_id, amount, type, description)
  VALUES (
    NEW.host_id, 
    40, 
    'subscription_bonus', 
    'Added new race: ' || COALESCE(NEW.name, 'Untitled Race')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to award review points (15 points for 5-star reviews)
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 15 points for 5-star reviews
  IF NEW.rating = 5 THEN
    UPDATE profiles 
    SET points_balance = points_balance + 15 
    WHERE id = NEW.reviewee_id;
    
    -- Record the transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.reviewee_id, 
      NEW.booking_id,
      15, 
      'subscription_bonus', 
      'Received 5-star review'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to award verification points (25 points)
CREATE OR REPLACE FUNCTION award_verification_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 25 points when verification is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE profiles 
    SET points_balance = points_balance + 25 
    WHERE id = NEW.user_id;
    
    -- Record the transaction
    INSERT INTO points_transactions (user_id, amount, type, description)
    VALUES (
      NEW.user_id, 
      25, 
      'subscription_bonus', 
      'Identity verification completed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to award subscription points (30 for new, 50 for renewal)
CREATE OR REPLACE FUNCTION award_subscription_points()
RETURNS TRIGGER AS $$
DECLARE
  is_renewal boolean := false;
  points_amount integer;
  description_text text;
  subscription_count integer;
BEGIN
  -- Only process when subscription becomes active
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    
    -- Check if this user has had subscriptions before
    SELECT COUNT(*) INTO subscription_count
    FROM subscriptions 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
    
    -- Determine if this is a renewal
    is_renewal := subscription_count > 0;
    
    -- Determine points and description
    IF is_renewal THEN
      points_amount := 50;
      description_text := 'Annual subscription renewal';
    ELSE
      points_amount := 30;
      description_text := 'New subscriber bonus';
    END IF;
    
    -- Award points
    UPDATE profiles 
    SET points_balance = points_balance + points_amount 
    WHERE id = NEW.user_id;
    
    -- Record the transaction
    INSERT INTO points_transactions (user_id, amount, type, description)
    VALUES (
      NEW.user_id, 
      points_amount, 
      'subscription_bonus', 
      description_text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to handle host cancellation penalties
CREATE OR REPLACE FUNCTION apply_host_cancellation_penalty()
RETURNS TRIGGER AS $$
DECLARE
  penalty_points integer;
BEGIN
  -- Only process when booking is cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    
    -- Use the same points the guest paid, or 100 points as default
    penalty_points := COALESCE(NEW.points_cost, 100);
    
    -- Deduct penalty points from host
    UPDATE profiles 
    SET points_balance = points_balance - penalty_points 
    WHERE id = NEW.host_id;
    
    -- Record the penalty transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.host_id, 
      NEW.id,
      -penalty_points, 
      'booking_refund', 
      CONCAT('Host cancellation penalty: ', penalty_points, ' points')
    );
    
    -- Refund points to guest
    UPDATE profiles 
    SET points_balance = points_balance + COALESCE(NEW.points_cost, 0)
    WHERE id = NEW.guest_id;
    
    -- Record the refund transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.guest_id, 
      NEW.id,
      COALESCE(NEW.points_cost, 0), 
      'booking_refund', 
      'Refund for host cancellation'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create all triggers
DROP TRIGGER IF EXISTS trigger_award_hosting_points ON bookings;
CREATE TRIGGER trigger_award_hosting_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_hosting_points();

DROP TRIGGER IF EXISTS trigger_award_property_points ON properties;
CREATE TRIGGER trigger_award_property_points
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION award_property_points();

DROP TRIGGER IF EXISTS trigger_award_race_points ON races;
CREATE TRIGGER trigger_award_race_points
  AFTER INSERT ON races
  FOR EACH ROW
  EXECUTE FUNCTION award_race_points();

DROP TRIGGER IF EXISTS trigger_award_review_points ON booking_reviews;
CREATE TRIGGER trigger_award_review_points
  AFTER INSERT ON booking_reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_points();

DROP TRIGGER IF EXISTS trigger_award_verification_points ON verification_requests;
CREATE TRIGGER trigger_award_verification_points
  AFTER UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION award_verification_points();

DROP TRIGGER IF EXISTS trigger_award_subscription_points ON subscriptions;
CREATE TRIGGER trigger_award_subscription_points
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION award_subscription_points();

DROP TRIGGER IF EXISTS trigger_host_cancellation_penalty ON bookings;
CREATE TRIGGER trigger_host_cancellation_penalty
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION apply_host_cancellation_penalty();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_provincial_points_per_night TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_race_booking_cost TO authenticated;
GRANT EXECUTE ON FUNCTION process_booking_with_provincial_points TO authenticated;
GRANT SELECT ON TABLE provincial_point_costs TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_provincial_point_costs_province ON provincial_point_costs(province);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_type ON points_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON bookings(status, check_in_date, check_out_date);

-- Add comments
COMMENT ON TABLE provincial_point_costs IS 'Stores point costs per night for each Spanish province';
COMMENT ON FUNCTION calculate_race_booking_cost(uuid, date, date) IS 'Calculates booking cost based on provincial rates';
COMMENT ON FUNCTION process_booking_with_provincial_points(uuid, uuid, uuid, uuid, date, date) IS 'Processes booking payment using provincial points system';

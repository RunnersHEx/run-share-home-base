-- SAFE Points System Bug Fixes - No Functionality Loss
-- This migration ONLY fixes the specific bugs without affecting working features

-- 1. Fix the host completion points calculation (the 80 points bug)
-- Only replace the existing buggy function with the correct calculation
CREATE OR REPLACE FUNCTION award_hosting_points()
RETURNS TRIGGER AS $$
DECLARE
  nights_count integer;
  total_points integer;
BEGIN
  -- Only process when booking is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- FIX: Calculate number of nights correctly (was giving fixed 80 points)
    nights_count := EXTRACT(DAY FROM (NEW.check_out_date::date - NEW.check_in_date::date));
    
    -- Ensure minimum of 1 night
    IF nights_count <= 0 THEN
      nights_count := 1;
    END IF;
    
    -- Award 40 points per night to the host (FIXED CALCULATION)
    total_points := nights_count * 40;
    
    -- Update host's points balance (same as before)
    UPDATE profiles 
    SET points_balance = points_balance + total_points 
    WHERE id = NEW.host_id;
    
    -- Record the transaction (same as before, but with correct amount)
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.host_id, 
      NEW.id, 
      total_points, 
      'booking_earning', 
      CONCAT('Hosting reward: ', nights_count, ' nights × 40 points = ', total_points, ' points')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the host cancellation penalty calculation (the 60 points bug)  
-- Only replace the existing buggy function with correct penalty calculation
CREATE OR REPLACE FUNCTION apply_host_cancellation_penalty()
RETURNS TRIGGER AS $$
DECLARE
  penalty_points integer;
  guest_refund_points integer;
BEGIN
  -- Only process when booking is cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    
    -- FIX: Use the actual points the guest paid, or 100 points as default (was fixed 60)
    penalty_points := COALESCE(NEW.points_cost, 100);
    guest_refund_points := COALESCE(NEW.points_cost, 0);
    
    -- Deduct penalty points from host (same logic, correct amount)
    UPDATE profiles 
    SET points_balance = points_balance - penalty_points 
    WHERE id = NEW.host_id;
    
    -- Record the penalty transaction (same logic, correct amount)
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      NEW.host_id, 
      NEW.id,
      -penalty_points, 
      'booking_refund', 
      CONCAT('Host cancellation penalty: ', penalty_points, ' points (booking cost)')
    );
    
    -- Refund points to guest (same logic, works correctly)
    IF guest_refund_points > 0 THEN
      UPDATE profiles 
      SET points_balance = points_balance + guest_refund_points
      WHERE id = NEW.guest_id;
      
      -- Record the refund transaction
      INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
      VALUES (
        NEW.guest_id, 
        NEW.id,
        guest_refund_points, 
        'booking_refund', 
        CONCAT('Refund for host cancellation: ', guest_refund_points, ' points')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add cancellation tracking fields (safe addition)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_by text CHECK (cancelled_by IN ('host', 'guest')),
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- 4. Create NEW RPC functions with different names (no conflicts)
CREATE OR REPLACE FUNCTION process_host_cancellation_penalty(
  p_booking_id UUID,
  p_host_id UUID,
  p_guest_id UUID,
  p_penalty_points INTEGER,
  p_refund_points INTEGER
)
RETURNS void AS $$
BEGIN
  -- Apply penalty to host
  UPDATE profiles 
  SET points_balance = points_balance - p_penalty_points 
  WHERE id = p_host_id;
  
  -- Record penalty transaction
  INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
  VALUES (
    p_host_id, 
    p_booking_id,
    -p_penalty_points, 
    'booking_refund', 
    CONCAT('Host cancellation penalty: ', p_penalty_points, ' points')
  );
  
  -- Refund guest if they paid
  IF p_refund_points > 0 THEN
    UPDATE profiles 
    SET points_balance = points_balance + p_refund_points
    WHERE id = p_guest_id;
    
    -- Record refund transaction
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      p_guest_id, 
      p_booking_id,
      p_refund_points, 
      'booking_refund', 
      CONCAT('Refund for host cancellation: ', p_refund_points, ' points')
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_guest_cancellation_refund(
  p_booking_id UUID,
  p_guest_id UUID,
  p_host_id UUID,
  p_check_in_date DATE,
  p_points_cost INTEGER
)
RETURNS void AS $$
DECLARE
  days_until_checkin INTEGER;
  should_refund BOOLEAN := false;
BEGIN
  -- Calculate days until check-in
  days_until_checkin := EXTRACT(DAY FROM (p_check_in_date - CURRENT_DATE));
  
  -- Determine if guest gets refund (7+ days before check-in)
  should_refund := days_until_checkin >= 7;
  
  IF should_refund AND p_points_cost > 0 THEN
    -- Refund guest
    UPDATE profiles 
    SET points_balance = points_balance + p_points_cost
    WHERE id = p_guest_id;
    
    -- Deduct from host
    UPDATE profiles 
    SET points_balance = points_balance - p_points_cost
    WHERE id = p_host_id;
    
    -- Record refund transaction for guest
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      p_guest_id, 
      p_booking_id,
      p_points_cost, 
      'booking_refund', 
      CONCAT('Guest cancellation refund (', days_until_checkin, ' days notice): ', p_points_cost, ' points')
    );
    
    -- Record deduction for host
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    VALUES (
      p_host_id, 
      p_booking_id,
      -p_points_cost, 
      'booking_refund', 
      CONCAT('Guest cancellation refund deduction: ', p_points_cost, ' points')
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions for NEW RPC functions only
GRANT EXECUTE ON FUNCTION process_host_cancellation_penalty(UUID, UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_guest_cancellation_refund(UUID, UUID, UUID, DATE, INTEGER) TO authenticated;

-- 6. Add performance indexes (safe additions)
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by ON bookings(cancelled_by) WHERE cancelled_by IS NOT NULL;

-- Comments for documentation
COMMENT ON FUNCTION award_hosting_points() IS 'FIXED: Now correctly calculates nights × 40 points instead of always 80';
COMMENT ON FUNCTION apply_host_cancellation_penalty() IS 'FIXED: Now uses actual guest payment amount instead of always 60';
COMMENT ON FUNCTION process_host_cancellation_penalty(UUID, UUID, UUID, INTEGER, INTEGER) IS 'RPC function for service-level host cancellation processing';
COMMENT ON FUNCTION process_guest_cancellation_refund(UUID, UUID, UUID, DATE, INTEGER) IS 'RPC function for guest cancellation with 7-day refund policy';

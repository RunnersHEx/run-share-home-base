-- Function to process booking points transactions
CREATE OR REPLACE FUNCTION process_booking_points_transaction(
  p_booking_id UUID,
  p_guest_id UUID,
  p_host_id UUID,
  p_points_cost INTEGER,
  p_transaction_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('booking_payment', 'booking_earning', 'booking_refund') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Process based on transaction type
  CASE p_transaction_type
    WHEN 'booking_payment' THEN
      -- Deduct points from guest
      UPDATE profiles 
      SET points_balance = points_balance - p_points_cost 
      WHERE id = p_guest_id AND points_balance >= p_points_cost;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient points balance for guest';
      END IF;
      
      -- Add points to host
      UPDATE profiles 
      SET points_balance = points_balance + p_points_cost 
      WHERE id = p_host_id;
      
      -- Record transactions
      INSERT INTO points_transactions (user_id, booking_id, amount, type, description) VALUES
        (p_guest_id, p_booking_id, -p_points_cost, 'booking_payment', 'Payment for booking'),
        (p_host_id, p_booking_id, p_points_cost, 'booking_earning', 'Earnings from hosting');

    WHEN 'booking_refund' THEN
      -- Refund points to guest
      UPDATE profiles 
      SET points_balance = points_balance + p_points_cost 
      WHERE id = p_guest_id;
      
      -- Deduct points from host
      UPDATE profiles 
      SET points_balance = points_balance - p_points_cost 
      WHERE id = p_host_id;
      
      -- Record refund transaction
      INSERT INTO points_transactions (user_id, booking_id, amount, type, description) VALUES
        (p_guest_id, p_booking_id, p_points_cost, 'booking_refund', 'Refund for cancelled booking'),
        (p_host_id, p_booking_id, -p_points_cost, 'booking_refund', 'Refund deduction');
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process penalty transactions
CREATE OR REPLACE FUNCTION process_penalty_transaction(
  p_user_id UUID,
  p_penalty_points INTEGER,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Deduct penalty points from user
  UPDATE profiles 
  SET points_balance = points_balance - p_penalty_points 
  WHERE id = p_user_id;
  
  -- Record penalty transaction
  INSERT INTO points_transactions (user_id, amount, type, description) VALUES
    (p_user_id, -p_penalty_points, 'booking_refund', CONCAT('Penalty: ', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically set booking response deadline
CREATE OR REPLACE FUNCTION set_booking_response_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deadline to 48 hours from creation
  NEW.host_response_deadline = NEW.created_at + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic deadline setting
DROP TRIGGER IF EXISTS trigger_set_booking_deadline ON bookings;
CREATE TRIGGER trigger_set_booking_deadline
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_response_deadline();

-- Function to check and update expired bookings
CREATE OR REPLACE FUNCTION check_expired_bookings()
RETURNS VOID AS $$
BEGIN
  -- Mark expired pending bookings as rejected
  UPDATE bookings 
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    host_response_message = 'Expired - no response within 48 hours'
  WHERE 
    status = 'pending' 
    AND host_response_deadline < NOW();
    
  -- Refund points for expired bookings
  WITH expired_bookings AS (
    SELECT id, guest_id, host_id, points_cost
    FROM bookings 
    WHERE status = 'rejected' 
    AND host_response_message = 'Expired - no response within 48 hours'
    AND rejected_at >= NOW() - INTERVAL '1 hour' -- Only process recently expired
  )
  INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
  SELECT 
    guest_id, 
    id, 
    points_cost, 
    'booking_refund', 
    'Automatic refund for expired booking'
  FROM expired_bookings;
  
  -- Update guest points balance
  UPDATE profiles 
  SET points_balance = points_balance + eb.points_cost
  FROM (
    SELECT guest_id, points_cost
    FROM bookings 
    WHERE status = 'rejected' 
    AND host_response_message = 'Expired - no response within 48 hours'
    AND rejected_at >= NOW() - INTERVAL '1 hour'
  ) eb
  WHERE id = eb.guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-confirm bookings on check-in date
CREATE OR REPLACE FUNCTION auto_confirm_bookings()
RETURNS VOID AS $$
BEGIN
  -- Update accepted bookings to confirmed when check-in date arrives
  UPDATE bookings 
  SET 
    status = 'confirmed',
    confirmed_at = NOW()
  WHERE 
    status = 'accepted' 
    AND check_in_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-complete bookings on check-out date
CREATE OR REPLACE FUNCTION auto_complete_bookings()
RETURNS VOID AS $$
BEGIN
  -- Update confirmed bookings to completed when check-out date arrives
  UPDATE bookings 
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE 
    status = 'confirmed' 
    AND check_out_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get booking statistics for a user
CREATE OR REPLACE FUNCTION get_booking_statistics(p_user_id UUID)
RETURNS TABLE(
  total_bookings INTEGER,
  pending_requests INTEGER,
  completed_bookings INTEGER,
  total_points_earned INTEGER,
  total_points_spent INTEGER,
  average_response_time FLOAT,
  acceptance_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_bookings AS (
    SELECT *
    FROM bookings 
    WHERE guest_id = p_user_id OR host_id = p_user_id
  ),
  host_bookings AS (
    SELECT *
    FROM user_bookings
    WHERE host_id = p_user_id
  ),
  guest_bookings AS (
    SELECT *
    FROM user_bookings
    WHERE guest_id = p_user_id
  ),
  points_summary AS (
    SELECT 
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as earned,
      COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as spent
    FROM points_transactions
    WHERE user_id = p_user_id
  ),
  response_times AS (
    SELECT 
      EXTRACT(EPOCH FROM (
        COALESCE(accepted_at, rejected_at) - created_at
      )) / 3600 as response_hours
    FROM host_bookings
    WHERE accepted_at IS NOT NULL OR rejected_at IS NOT NULL
  )
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM user_bookings),
    (SELECT COUNT(*)::INTEGER FROM user_bookings WHERE status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM user_bookings WHERE status = 'completed'),
    (SELECT earned::INTEGER FROM points_summary),
    (SELECT spent::INTEGER FROM points_summary),
    (SELECT COALESCE(AVG(response_hours), 0)::FLOAT FROM response_times),
    (SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status IN ('accepted', 'confirmed', 'completed'))::FLOAT / COUNT(*)::FLOAT) * 100
      END
     FROM host_bookings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dynamic race points
CREATE OR REPLACE FUNCTION calculate_dynamic_race_points(
  p_race_id UUID,
  p_property_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  base_points INTEGER := 100;
  open_requests INTEGER := 0;
  availability_count INTEGER := 1;
  demand_ratio FLOAT := 0;
  dynamic_multiplier FLOAT := 0;
  final_points INTEGER;
  race_locality TEXT;
BEGIN
  -- Get property locality for demand calculation
  SELECT locality INTO race_locality
  FROM properties p
  INNER JOIN races r ON r.property_id = p.id
  WHERE r.id = p_race_id;
  
  -- Count open requests in the same area and overlapping dates
  SELECT COUNT(*) INTO open_requests
  FROM bookings b
  INNER JOIN properties prop ON b.property_id = prop.id
  WHERE b.status = 'pending'
    AND prop.locality = race_locality
    AND b.check_in_date <= p_check_out_date
    AND b.check_out_date >= p_check_in_date;
  
  -- Count available properties in the same area for same dates
  SELECT COUNT(DISTINCT p.id) INTO availability_count
  FROM properties p
  INNER JOIN races r ON r.property_id = p.id
  WHERE p.locality = race_locality
    AND p.is_active = true
    AND r.race_date >= p_check_in_date
    AND r.race_date <= p_check_out_date
    AND NOT EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.property_id = p.id 
        AND b.status IN ('accepted', 'confirmed')
        AND b.check_in_date <= p_check_out_date
        AND b.check_out_date >= p_check_in_date
    );
  
  -- Ensure availability_count is at least 1 to avoid division by zero
  availability_count := GREATEST(availability_count, 1);
  
  -- Calculate demand ratio and dynamic multiplier
  demand_ratio := open_requests::FLOAT / availability_count::FLOAT;
  dynamic_multiplier := LN(1 + demand_ratio);
  
  -- Calculate final points: base × (1 + log(1 + open_requests / availability))
  final_points := ROUND(base_points * (1 + dynamic_multiplier));
  
  -- Apply min/max constraints
  final_points := GREATEST(50, LEAST(500, final_points));
  
  RETURN final_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_booking_points_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION process_penalty_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION auto_confirm_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION auto_complete_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_dynamic_race_points TO authenticated;

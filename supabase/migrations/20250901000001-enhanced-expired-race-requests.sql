-- Enhanced function to handle expired race requests
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
    
  -- Get expired bookings for processing
  WITH expired_bookings AS (
    SELECT 
      b.id, 
      b.guest_id, 
      b.host_id, 
      b.race_id,
      b.points_cost,
      ph.first_name as host_first_name,
      ph.last_name as host_last_name,
      pg.first_name as guest_first_name,
      pg.last_name as guest_last_name,
      r.name as race_name
    FROM bookings b
    INNER JOIN profiles ph ON b.host_id = ph.id
    INNER JOIN profiles pg ON b.guest_id = pg.id
    INNER JOIN races r ON b.race_id = r.id
    WHERE b.status = 'rejected' 
    AND b.host_response_message = 'Expired - no response within 48 hours'
    AND b.rejected_at >= NOW() - INTERVAL '1 hour' -- Only process recently expired
  ),
  
  -- Process refunds for expired bookings
  processed_refunds AS (
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    SELECT 
      guest_id, 
      id, 
      points_cost, 
      'booking_refund', 
      'Automatic refund for expired booking'
    FROM expired_bookings
    RETURNING *
  ),
  
  -- Apply host penalties (-30 points)
  host_penalties AS (
    INSERT INTO points_transactions (user_id, booking_id, amount, type, description)
    SELECT 
      host_id, 
      id, 
      -30, 
      'booking_refund', 
      'Penalty: No response to booking request within deadline'
    FROM expired_bookings
    RETURNING *
  ),
  
  -- Update guest points balance (refund)
  guest_balance_updates AS (
    UPDATE profiles 
    SET points_balance = points_balance + eb.points_cost
    FROM expired_bookings eb
    WHERE id = eb.guest_id
    RETURNING profiles.id, eb.points_cost
  ),
  
  -- Update host points balance (penalty)
  host_balance_updates AS (
    UPDATE profiles 
    SET points_balance = points_balance - 30
    FROM expired_bookings eb
    WHERE id = eb.host_id
    RETURNING profiles.id
  ),
  
  -- Mark races as available for booking again
  race_availability_updates AS (
    UPDATE races 
    SET 
      is_available_for_booking = true,
      updated_at = NOW()
    FROM expired_bookings eb
    WHERE id = eb.race_id
    RETURNING races.id, eb.host_id, eb.race_name
  ),
  
  -- Send penalty notifications to hosts
  host_notifications AS (
    INSERT INTO user_notifications (user_id, type, title, message, data)
    SELECT 
      eb.host_id,
      'cancellation_penalty',
      'Penalización por falta de respuesta',
      'Recibiste una solicitud de carrera pero no respondiste antes de la fecha límite, por lo que tu carrera aparece nuevamente en la búsqueda de carreras como activa a menos que la elimines, y tú como anfitrión eres penalizado con una deducción de 30 puntos. Esperamos no tener que enviarte este mensaje nuevamente. Muchas gracias por tu comprensión.',
      jsonb_build_object(
        'booking_id', eb.id,
        'race_id', eb.race_id,
        'race_name', eb.race_name,
        'penalty_points', -30,
        'reason', 'No response to booking request within 48 hours',
        'penalty_date', NOW()
      )
    FROM expired_bookings eb
    RETURNING *
  )
  
  -- Send refund notifications to guests
  INSERT INTO user_notifications (user_id, type, title, message, data)
  SELECT 
    eb.guest_id,
    'booking_refund',
    'Reembolso por falta de respuesta del anfitrión',
    CONCAT('Tu solicitud para "', eb.race_name, '" ha expirado porque el anfitrión no respondió a tiempo. Se han reembolsado ', eb.points_cost, ' puntos a tu cuenta automáticamente.'),
    jsonb_build_object(
      'booking_id', eb.id,
      'race_id', eb.race_id,
      'race_name', eb.race_name,
      'host_name', CONCAT(eb.host_first_name, ' ', eb.host_last_name),
      'refund_points', eb.points_cost,
      'reason', 'Host did not respond within 48 hours',
      'refund_date', NOW()
    )
  FROM expired_bookings eb;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_expired_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_bookings TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION check_expired_bookings() IS 'Enhanced function to handle expired race booking requests: refunds points to guests, penalizes hosts with -30 points, makes races available again, and sends notifications to both hosts and guests';

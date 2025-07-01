
-- Índices optimizados para búsquedas frecuentes en Runners Home Exchange

-- Índices para búsquedas de carreras
CREATE INDEX IF NOT EXISTS idx_races_location_date ON public.races(race_date, property_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_races_active_search ON public.races(is_active, race_date, points_cost);

-- Índices para bookings por fechas
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_host_guest ON public.bookings(host_id, guest_id, status);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_created ON public.booking_messages(booking_id, created_at DESC);

-- Índices para búsquedas de usuarios
CREATE INDEX IF NOT EXISTS idx_profiles_verification_location ON public.profiles(verification_status, is_host, is_guest) WHERE verification_status = 'approved';

-- Índices para propiedades activas
CREATE INDEX IF NOT EXISTS idx_properties_active_location ON public.properties(is_active, locality, provinces) WHERE is_active = true;

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON public.user_notifications(user_id, read, created_at DESC);

-- Índices para transacciones de puntos
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_date ON public.points_transactions(user_id, created_at DESC);

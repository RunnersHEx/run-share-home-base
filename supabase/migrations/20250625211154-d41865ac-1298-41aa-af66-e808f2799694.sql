
-- Crear tabla de reservas (bookings)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Detalles de estancia
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  
  -- Comunicación
  request_message TEXT,
  special_requests TEXT,
  guest_phone TEXT,
  estimated_arrival_time TIME,
  host_response_message TEXT,
  
  -- Gestión
  points_cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled')),
  
  -- Deadlines
  host_response_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_guests_count CHECK (guests_count > 0),
  CONSTRAINT valid_points_cost CHECK (points_cost > 0)
);

-- Crear tabla de mensajes de reserva para comunicación
CREATE TABLE public.booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla para transacciones de puntos
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Positivo para ganar puntos, negativo para gastar
  type TEXT NOT NULL CHECK (type IN ('booking_payment', 'booking_earning', 'booking_refund', 'subscription_bonus')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX idx_bookings_host_id ON public.bookings(host_id);
CREATE INDEX idx_bookings_race_id ON public.bookings(race_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX idx_booking_messages_booking_id ON public.booking_messages(booking_id);
CREATE INDEX idx_points_transactions_user_id ON public.points_transactions(user_id);

-- Habilitar Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bookings
CREATE POLICY "Users can view bookings as guest or host"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Guests can create booking requests"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts can update their bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = host_id);

-- Políticas RLS para booking_messages
CREATE POLICY "Users can view messages in their bookings"
  ON public.booking_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (guest_id = auth.uid() OR host_id = auth.uid())
  ));

CREATE POLICY "Users can send messages in their bookings"
  ON public.booking_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (guest_id = auth.uid() OR host_id = auth.uid())
    )
  );

-- Políticas RLS para points_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON public.points_transactions FOR INSERT
  WITH CHECK (true); -- Las transacciones serán creadas por funciones del sistema

-- Trigger para actualizar updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para procesar transacciones de puntos
CREATE OR REPLACE FUNCTION public.process_booking_points_transaction(
  p_booking_id UUID,
  p_guest_id UUID,
  p_host_id UUID,
  p_points_cost INTEGER,
  p_transaction_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Crear transacción para el guest (débito)
  IF p_transaction_type = 'booking_payment' THEN
    INSERT INTO public.points_transactions (user_id, booking_id, amount, type, description)
    VALUES (p_guest_id, p_booking_id, -p_points_cost, 'booking_payment', 'Pago por reserva de carrera');
    
    -- Actualizar balance del guest
    UPDATE public.profiles 
    SET points_balance = points_balance - p_points_cost
    WHERE id = p_guest_id;
    
    -- Crear transacción para el host (crédito)
    INSERT INTO public.points_transactions (user_id, booking_id, amount, type, description)
    VALUES (p_host_id, p_booking_id, p_points_cost, 'booking_earning', 'Ganancia por hosting de carrera');
    
    -- Actualizar balance del host
    UPDATE public.profiles 
    SET points_balance = points_balance + p_points_cost
    WHERE id = p_host_id;
    
  -- Procesar reembolso
  ELSIF p_transaction_type = 'booking_refund' THEN
    INSERT INTO public.points_transactions (user_id, booking_id, amount, type, description)
    VALUES (p_guest_id, p_booking_id, p_points_cost, 'booking_refund', 'Reembolso por cancelación de reserva');
    
    -- Actualizar balance del guest
    UPDATE public.profiles 
    SET points_balance = points_balance + p_points_cost
    WHERE id = p_guest_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estadísticas de propiedades cuando se completa una reserva
CREATE OR REPLACE FUNCTION public.update_property_stats_on_booking_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.properties 
    SET 
      total_bookings = total_bookings + 1,
      points_earned = points_earned + NEW.points_cost
    WHERE id = NEW.property_id;
    
    -- Actualizar estadísticas del host
    UPDATE public.profiles 
    SET total_host_experiences = total_host_experiences + 1
    WHERE id = NEW.host_id;
    
    -- Actualizar estadísticas del guest
    UPDATE public.profiles 
    SET total_guest_experiences = total_guest_experiences + 1
    WHERE id = NEW.guest_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_stats_on_completion
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_stats_on_booking_completion();

-- Función para establecer deadline de respuesta (48 horas)
CREATE OR REPLACE FUNCTION public.set_booking_response_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.host_response_deadline = NEW.created_at + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_deadline
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_response_deadline();

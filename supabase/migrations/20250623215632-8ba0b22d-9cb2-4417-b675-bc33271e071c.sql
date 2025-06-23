
-- Crear tabla para gestionar verificaciones de admin
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para notificaciones a usuarios
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data JSONB
);

-- Habilitar RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para verification_requests (solo admins pueden ver todas)
CREATE POLICY "Users can view their own verification requests" 
  ON public.verification_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Políticas para user_notifications (usuarios solo ven las suyas)
CREATE POLICY "Users can view their own notifications" 
  ON public.user_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.user_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Función para crear solicitud de verificación automáticamente
CREATE OR REPLACE FUNCTION public.create_verification_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si hay documentos subidos y no existe ya una solicitud
  IF array_length(NEW.verification_documents, 1) > 0 AND 
     (OLD.verification_documents IS NULL OR array_length(OLD.verification_documents, 1) = 0) THEN
    
    INSERT INTO public.verification_requests (user_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear solicitud cuando se suben documentos
CREATE TRIGGER on_documents_uploaded
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_verification_request();

-- Función para actualizar estado de verificación en perfil
CREATE OR REPLACE FUNCTION public.update_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el estado en la tabla profiles
  UPDATE public.profiles 
  SET verification_status = NEW.status
  WHERE id = NEW.user_id;
  
  -- Crear notificación para el usuario
  INSERT INTO public.user_notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'verification_update',
    CASE 
      WHEN NEW.status = 'approved' THEN '¡Verificación Aprobada!'
      WHEN NEW.status = 'rejected' THEN 'Verificación Rechazada'
      ELSE 'Estado de Verificación Actualizado'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Tu perfil ha sido verificado exitosamente. Ya puedes usar todas las funciones de la plataforma.'
      WHEN NEW.status = 'rejected' THEN 'Tu verificación fue rechazada. Por favor, sube nuevos documentos. Motivo: ' || COALESCE(NEW.admin_notes, 'No especificado')
      ELSE 'El estado de tu verificación ha cambiado a: ' || NEW.status
    END,
    jsonb_build_object('verification_status', NEW.status, 'admin_notes', NEW.admin_notes)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estado cuando admin aprueba/rechaza
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_profile_verification_status();

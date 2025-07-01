
-- Agregar columna is_active a profiles para activar/desactivar usuarios
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Agregar columna approval_status a properties para gestión de aprobaciones
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Crear tabla para identificar administradores
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- Políticas para admin_users (solo admins pueden ver)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin_users" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Políticas para que admins puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Políticas para que admins puedan ver todas las propiedades
CREATE POLICY "Admins can view all properties" 
  ON public.properties 
  FOR SELECT 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update all properties" 
  ON public.properties 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Políticas para que admins puedan ver todas las verification_requests
CREATE POLICY "Admins can view all verification requests" 
  ON public.verification_requests 
  FOR SELECT 
  USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update all verification requests" 
  ON public.verification_requests 
  FOR UPDATE 
  USING (public.is_admin(auth.jwt() ->> 'email'));

-- Insertar el email del administrador principal
INSERT INTO public.admin_users (email) 
VALUES ('runnershomeexchange@gmail.com')
ON CONFLICT (email) DO NOTHING;

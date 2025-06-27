
-- Crear la foreign key entre races.host_id y profiles.id
ALTER TABLE public.races 
DROP CONSTRAINT IF EXISTS races_host_id_fkey;

ALTER TABLE public.races 
ADD CONSTRAINT races_host_id_profiles_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_races_host_id_profiles ON public.races(host_id);

-- Crear la foreign key entre races.property_id y properties.id si no existe
ALTER TABLE public.races 
DROP CONSTRAINT IF EXISTS races_property_id_fkey;

ALTER TABLE public.races 
ADD CONSTRAINT races_property_id_properties_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_races_property_id_properties ON public.races(property_id);

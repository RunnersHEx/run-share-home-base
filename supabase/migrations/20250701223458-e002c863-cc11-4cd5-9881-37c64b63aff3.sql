
-- Eliminar la restricción que está causando problemas con running_experience vacío
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_running_experience_check;

-- Permitir valores vacíos o NULL para running_experience
-- Si necesitamos una restricción, la haremos más flexible
ALTER TABLE public.profiles ADD CONSTRAINT profiles_running_experience_check 
CHECK (running_experience IS NULL OR running_experience = '' OR running_experience IN ('principiante', 'intermedio', 'avanzado', 'experto'));


-- Verificar qué valores acepta la base de datos para running_experience
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_running_experience_check';

-- Si no existe o los valores no coinciden, actualizar el constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_running_experience_check;

-- Crear el constraint con los valores correctos que usa el frontend
ALTER TABLE profiles ADD CONSTRAINT profiles_running_experience_check 
CHECK (running_experience IN ('beginner', 'intermediate', 'advanced', 'expert', 'elite'));

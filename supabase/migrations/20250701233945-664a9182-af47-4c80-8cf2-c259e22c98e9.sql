
-- Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    birth_date, 
    bio, 
    running_experience, 
    running_modalities, 
    preferred_distances, 
    personal_records, 
    races_completed_this_year, 
    emergency_contact_name, 
    emergency_contact_phone, 
    is_host, 
    is_guest
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'running_experience',
    COALESCE((NEW.raw_user_meta_data->>'running_modalities')::text[], '{}'),
    COALESCE((NEW.raw_user_meta_data->>'preferred_distances')::text[], '{}'),
    COALESCE((NEW.raw_user_meta_data->>'personal_records')::jsonb, '{}'),
    COALESCE((NEW.raw_user_meta_data->>'races_completed_this_year')::integer, 0),
    NEW.raw_user_meta_data->>'emergency_contact_name',
    NEW.raw_user_meta_data->>'emergency_contact_phone',
    COALESCE((NEW.raw_user_meta_data->>'is_host')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_guest')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Eliminar todas las notificaciones de usuario
DELETE FROM public.user_notifications;

-- Eliminar todas las solicitudes de verificación
DELETE FROM public.verification_requests;

-- Eliminar todos los perfiles de usuario
DELETE FROM public.profiles;

-- Eliminar todas las propiedades y sus datos relacionados
DELETE FROM public.property_images;
DELETE FROM public.property_availability;
DELETE FROM public.properties;

-- Eliminar todas las carreras y sus datos relacionados
DELETE FROM public.race_images;
DELETE FROM public.races;

-- Eliminar todas las reseñas
DELETE FROM public.reviews;

-- Eliminar todas las solicitudes de intercambio
DELETE FROM public.swap_requests;

-- Eliminar todas las suscripciones
DELETE FROM public.subscriptions;

-- Eliminar todas las casas (tabla legacy)
DELETE FROM public.houses;

-- Finalmente, eliminar todos los usuarios de auth (esto eliminará en cascada otros datos relacionados)
DELETE FROM auth.users;

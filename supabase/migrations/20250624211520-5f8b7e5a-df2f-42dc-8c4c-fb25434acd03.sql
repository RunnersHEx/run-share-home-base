
-- Eliminar todas las notificaciones de usuario
DELETE FROM public.user_notifications;

-- Eliminar todas las solicitudes de verificación
DELETE FROM public.verification_requests;

-- Eliminar todas las imágenes de propiedades
DELETE FROM public.property_images;

-- Eliminar todas las disponibilidades de propiedades
DELETE FROM public.property_availability;

-- Eliminar todas las propiedades
DELETE FROM public.properties;

-- Eliminar todas las imágenes de carreras
DELETE FROM public.race_images;

-- Eliminar todas las carreras
DELETE FROM public.races;

-- Eliminar todas las reseñas
DELETE FROM public.reviews;

-- Eliminar todas las solicitudes de intercambio
DELETE FROM public.swap_requests;

-- Eliminar todas las suscripciones
DELETE FROM public.subscriptions;

-- Eliminar todas las casas (tabla legacy)
DELETE FROM public.houses;

-- Eliminar todos los perfiles de usuario
DELETE FROM public.profiles;

-- Finalmente, eliminar todos los usuarios de auth (esto eliminará en cascada otros datos relacionados)
DELETE FROM auth.users;

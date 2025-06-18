
import { Property, PropertyFormData } from "@/types/property";

export function cleanPropertyDataForInsert(propertyData: Partial<Property>, userId: string) {
  return {
    title: propertyData.title || '',
    description: propertyData.description || null,
    provinces: propertyData.provinces || [],
    locality: propertyData.locality || '',
    full_address: propertyData.full_address || '',
    latitude: propertyData.latitude || null,
    longitude: propertyData.longitude || null,
    bedrooms: propertyData.bedrooms || 1,
    beds: propertyData.beds || 1,
    bathrooms: propertyData.bathrooms || 1,
    max_guests: propertyData.max_guests || 1,
    amenities: propertyData.amenities || [],
    house_rules: propertyData.house_rules || null,
    check_in_instructions: propertyData.check_in_instructions || null,
    runner_instructions: propertyData.runner_instructions || null,
    cancellation_policy: propertyData.cancellation_policy || 'flexible',
    owner_id: userId
  };
}

export function cleanPropertyDataForUpdate(updates: Partial<Property>) {
  return {
    ...(updates.title && { title: updates.title }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.provinces && { provinces: updates.provinces }),
    ...(updates.locality && { locality: updates.locality }),
    ...(updates.full_address && { full_address: updates.full_address }),
    ...(updates.latitude !== undefined && { latitude: updates.latitude }),
    ...(updates.longitude !== undefined && { longitude: updates.longitude }),
    ...(updates.bedrooms && { bedrooms: updates.bedrooms }),
    ...(updates.beds && { beds: updates.beds }),
    ...(updates.bathrooms && { bathrooms: updates.bathrooms }),
    ...(updates.max_guests && { max_guests: updates.max_guests }),
    ...(updates.amenities && { amenities: updates.amenities }),
    ...(updates.house_rules !== undefined && { house_rules: updates.house_rules }),
    ...(updates.check_in_instructions !== undefined && { check_in_instructions: updates.check_in_instructions }),
    ...(updates.runner_instructions !== undefined && { runner_instructions: updates.runner_instructions }),
    ...(updates.cancellation_policy && { cancellation_policy: updates.cancellation_policy }),
    ...(updates.is_active !== undefined && { is_active: updates.is_active })
  };
}

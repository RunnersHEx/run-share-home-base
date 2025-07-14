/**
 * Utility functions for messaging
 */

export interface UserNameData {
  first_name?: string;
  last_name?: string;
}

/**
 * Get a clean display name from user data
 */
export function getUserDisplayName(user: UserNameData | null | undefined): string {
  if (!user) return 'User';
  
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'User';
  }
}

/**
 * Get initials from user data
 */
export function getUserInitials(user: UserNameData | null | undefined): string {
  if (!user) return 'U';
  
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  } else if (firstInitial) {
    return firstInitial;
  } else if (lastInitial) {
    return lastInitial;
  } else {
    return 'U';
  }
}

/**
 * Check if a string is a valid user name (not empty, undefined, etc.)
 */
export function isValidUserName(name: string | null | undefined): boolean {
  return !!(name && name.trim() !== '' && name !== 'undefined' && name !== 'null');
}

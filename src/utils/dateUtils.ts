/**
 * Utility functions for handling dates in forms and database operations
 */

export const dateUtils = {
  /**
   * Formats a date string for HTML date input fields (YYYY-MM-DD format)
   */
  formatForInput: (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Try to parse and format other date formats
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  },

  /**
   * Formats a date string for database storage (handles null/empty values)
   */
  formatForDatabase: (dateString: string | null | undefined): string | null => {
    if (!dateString || dateString.trim() === '') {
      return null;
    }
    
    // Validate the date format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      // Return in ISO format (YYYY-MM-DD)
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  },

  /**
   * Validates if a date string is valid
   */
  isValid: (dateString: string | null | undefined): boolean => {
    if (!dateString) return true; // null/empty is considered valid (optional field)
    
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  },

  /**
   * Formats a date for display (human-readable format)
   */
  formatForDisplay: (dateString: string | null | undefined, locale: string = 'es-ES'): string => {
    if (!dateString) return 'No especificado';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }
};

/**
 * Cleans form data before sending to database
 * Converts empty strings to null for nullable fields
 * Keeps arrays as arrays (even if empty) to match database schema
 */
export const cleanFormData = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Handle date fields specially
    if (key.includes('date') || key.endsWith('_date')) {
      cleaned[key] = dateUtils.formatForDatabase(value);
    }
    // Handle other string fields
    else if (typeof value === 'string' && value.trim() === '') {
      cleaned[key] = null;
    }
    // Keep arrays as arrays (even if empty) - DO NOT convert to null
    // This is important for database fields like preferred_distances, running_modalities, etc.
    else if (Array.isArray(value)) {
      cleaned[key] = value; // Keep empty arrays as []
    }
    // Handle objects (like personal_records)
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Keep objects as they are, even if empty
      cleaned[key] = value;
    }
    // Keep other values as is
    else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

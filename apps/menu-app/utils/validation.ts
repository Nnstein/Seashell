import { LocationSection } from '../src/types';

/**
 * Guest Input Validation Utilities
 * Handles normalization and validation for dynamic sections and phone numbers.
 */

export interface ValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
  section?: LocationSection;
}

/**
 * Normalize and validate a Kuwait phone number.
 *
 * Acceptable formats:
 *   - 8 digits local: 55555555, 99999999, 66666666
 *   - With +965 prefix: +96555555555
 *   - With 965 prefix: 96555555555
 *
 * Normalizes to 8-digit local format.
 */
export function normalizePhone(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, normalized: '', error: 'Phone number is required' };
  }

  // Extract digits only
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Handle +965 / 965 prefix (11 digits total: 965 + 8)
  let localNumber: string;
  if (digitsOnly.length === 11 && digitsOnly.startsWith('965')) {
    localNumber = digitsOnly.slice(3);
  } else if (digitsOnly.length === 8) {
    localNumber = digitsOnly;
  } else {
    return {
      valid: false,
      normalized: '',
      error: 'Phone must be 8 digits (e.g. 99999999) or include +965 prefix\nيجب أن يتكون رقم الهاتف من 8 أرقام (مثل 99999999) أو يتضمن بادئة +965'
    };
  }

  // Kuwait mobile prefixes: 5, 6, or 9
  if (!/^[569]/.test(localNumber)) {
    return {
      valid: false,
      normalized: '',
      error: 'Phone number must start with 5, 6, or 9\nيجب أن يبدأ رقم الهاتف بـ 5 أو 6 أو 9'
    };
  }

  return { valid: true, normalized: localNumber };
}

/**
 * Validate guest location input against dynamic Firestore sections.
 */
export function validateDynamicSection(input: string, sections: LocationSection[], isBeachMode: boolean): ValidationResult {
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, normalized: '', error: 'Location number is required' };
  }

  // Filter available sections based on the current app mode
  const availableSections = sections.filter(s => 
    isBeachMode ? s.menu === 'seashell' : s.menu !== 'seashell'
  );

  if (availableSections.length === 0) {
     return { valid: false, normalized: '', error: 'No login sections configured for this area. Please contact administration.' };
  }

  // Try to parse an alphabetical prefix and a numeric part
  const match = trimmed.match(/^([A-Z]*)\s*(\d+)$/);
  
  if (!match) {
    return { 
      valid: false, 
      normalized: '', 
      error: 'Invalid location format. Must be letters followed by numbers (e.g. GB5 or 101).' 
    };
  }

  let prefix = match[1];
  let numericPart = match[2];
  let num = parseInt(numericPart, 10);

  let matchedSection: LocationSection | undefined;

  // If no prefix entered, fallback to the default section for this mode
  if (prefix === '') {
    matchedSection = availableSections.find(s => s.isDefault);
    
    // Fallback: If we have multiple defaults, or none, just take the first default or first section
    if (!matchedSection && availableSections.length > 0) {
       matchedSection = availableSections[0];
    }
  } else {
    // Find the section that matches this prefix
    matchedSection = availableSections.find(s => s.prefix.toUpperCase() === prefix);
    
    // Some users might type "SB5" on Beach Mode. If they typed a prefix, but we couldn't find a matching section
    // it could be they are trying to access a section not allowed in this mode.
    if (!matchedSection) {
       return { 
         valid: false, 
         normalized: '', 
         error: `Invalid location prefix '${prefix}' for this area.` 
       };
    }
  }

  if (!matchedSection) {
     return { valid: false, normalized: '', error: 'Configuration error: Cannot find a valid login section.' };
  }

  // Check if the number falls within the section's allowed ranges
  if (matchedSection.ranges && matchedSection.ranges.length > 0) {
    const isValidRange = matchedSection.ranges.some(r => num >= r.min && num <= r.max);
    if (!isValidRange) {
        return { 
          valid: false, 
          normalized: '', 
          error: `${matchedSection.name} number out of valid range.\nرقم غير صالح` 
        };
    }
  }

  // Apply padding (e.g. padding to 3 for 'SB005')
  let normalizedStr = num.toString();
  if (matchedSection.padLength > 0) {
     normalizedStr = normalizedStr.padStart(matchedSection.padLength, '0');
  }

  return {
    valid: true,
    normalized: `${matchedSection.prefix}${normalizedStr}`,
    section: matchedSection
  };
}

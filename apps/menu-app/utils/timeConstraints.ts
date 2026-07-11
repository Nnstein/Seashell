/**
 * Time constraint validation for menu items.
 */

import { MenuItem } from '../src/types';

export interface TimeAvailability {
  isAvailable: boolean;
  message?: {
    en: string;
    ar: string;
  };
}

/**
 * Checks if a menu item is currently available based on time-of-day constraints.
 * This is primarily used for the room-service menu.
 * 
 * Rules:
 * - Breakfast: Available until 11:00 AM
 * - Pizza: Available from 12:00 PM (noon) to 10:30 PM
 */
export function checkItemTimeAvailability(item: MenuItem, activeMenu: string | null): TimeAvailability {
  // Constraints ONLY apply to the room-service menu
  if (activeMenu !== 'room-service' && item.menu !== 'room-service') {
    return { isAvailable: true };
  }

  const category = item.category?.toLowerCase() || '';
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Helper to convert time to minutes for easier comparison
  const currentMinutes = hours * 60 + minutes;

  if (category === 'breakfast') {
    // Breakfast available from 6:30 AM (6 * 60 + 30 = 390) to 11:00 AM (11 * 60 = 660)
    const startTime = 6 * 60 + 30;
    const endTime = 11 * 60;
    if (currentMinutes < startTime || currentMinutes >= endTime) {
      return {
        isAvailable: false,
        message: {
          en: 'Breakfast items are only available from 6:30 AM to 11:00 AM',
          ar: 'عناصر الإفطار متوفرة فقط من 6:30 صباحاً حتى 11:00 صباحاً'
        }
      };
    }
  }

  if (category === 'pizza') {
    // Pizza only available 12:00 PM (12 * 60 = 720) to 10:00 PM (22 * 60 = 1320)
    const startTime = 12 * 60;
    const endTime = 22 * 60;

    if (currentMinutes < startTime || currentMinutes > endTime) {
      return {
        isAvailable: false,
        message: {
          en: 'Pizza is only available from 12:00 PM to 10:00 PM',
          ar: 'البيتزا متوفرة فقط من الساعة 12:00 ظهراً إلى 10:00 مساءً'
        }
      };
    }
  }

  return { isAvailable: true };
}

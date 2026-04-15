/**
 * Utility functions for generating varied preparation time messages
 */

interface PrepTimeMessage {
  en: string;
  ar: string;
}

/**
 * Convert minutes to a friendly time format
 * e.g., 40 -> "40 mins", 70 -> "1h 10 mins", 120 -> "2 hours"
 */
export const formatPrepTime = (minutes: number, language: 'en' | 'ar'): string => {
  if (minutes < 60) {
    return language === 'ar' ? `${minutes} دقيقة` : `${minutes} mins`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  
  if (remainingMins === 0) {
    if (language === 'ar') {
      return hours === 1 ? 'ساعة واحدة' : `${hours} ساعات`;
    }
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  if (language === 'ar') {
    const hourText = hours === 1 ? 'ساعة' : `${hours} ساعات`;
    return `${hourText} و ${remainingMins} دقيقة`;
  }
  
  return `${hours}h ${remainingMins} mins`;
};

/**
 * Generate a random varied message for preparation time
 * Returns different phrasings to make it feel more personal
 */
export const getRandomPrepTimeMessage = (minutes: number, language: 'en' | 'ar'): PrepTimeMessage => {
  const timeStr = formatPrepTime(minutes, language);
  
  const messages: PrepTimeMessage[] = [
    {
      en: `Your order will be ready within ${formatPrepTime(minutes, 'en')}`,
      ar: `سيكون طلبك جاهزاً خلال ${formatPrepTime(minutes, 'ar')}`
    },
    {
      en: `We'll get it ready for you within ${formatPrepTime(minutes, 'en')}`,
      ar: `سنجهزه لك خلال ${formatPrepTime(minutes, 'ar')}`
    },
    {
      en: `Estimated delivery time: ${formatPrepTime(minutes, 'en')}`,
      ar: `وقت التوصيل المقدر: ${formatPrepTime(minutes, 'ar')}`
    },
    {
      en: `Your delicious meal arrives in ${formatPrepTime(minutes, 'en')}`,
      ar: `وجبتك اللذيذة ستصل خلال ${formatPrepTime(minutes, 'ar')}`
    },
    {
      en: `Sit back and relax! Ready in ${formatPrepTime(minutes, 'en')}`,
      ar: `استرخِ! جاهز خلال ${formatPrepTime(minutes, 'ar')}`
    },
    {
      en: `Fresh from our kitchen in ${formatPrepTime(minutes, 'en')}`,
      ar: `طازج من مطبخنا خلال ${formatPrepTime(minutes, 'ar')}`
    }
  ];
  
  // Use the prep time as a seed for consistency per order
  const index = minutes % messages.length;
  return messages[index];
};

/**
 * Get a simple label for the preparation time section
 */
export const getPrepTimeLabel = (language: 'en' | 'ar'): string => {
  return language === 'ar' ? 'وقت التحضير' : 'Preparation Time';
};

// ===================================
// SHARED MENU CATEGORY DEFINITIONS
// ===================================
// This file defines categories for BOTH menus: Presto and Room Service
// These definitions MUST match exactly what's in Firestore!

// Room Service Menu Categories (17 categories - matches seeding scripts)
export const ROOM_SERVICE_CATEGORIES = [
    'Breakfast',
    'Appetizers',
    'Salads',
    'Sandwiches',
    'Burgers',
    'Pizza',
    'Pasta',
    'Seafood',
    'Main Course',
    'Kids',
    'Desserts',
    'Beverages',
    'Smoothies',
    'Milkshakes',
    'Mocktails',
    'Chai Latte',
    'Refreshing Drinks'
] as const;

// Presto Menu Categories (Café/Coffee Shop style)
export const PRESTO_CATEGORIES = [
    'Hot Beverages',
    'Cold Beverages',
    'Frappes',
    'Smoothies',
    'Milkshakes',
    'Fresh Juices',
    'Cocktails',
    'Malt Beverages',
    'Refreshing Drinks',
    'Appetizers',
    'Italian Pasta',
    'Soups',
    'Salads',
    'Risotto',
    'Pizzeria Chez Nous',
    'Main Course',
    'Sweets and Fruits',
    'Breakfast'
] as const;

// Union type for all categories
export type RoomServiceCategory = typeof ROOM_SERVICE_CATEGORIES[number];
export type PrestoCategory = typeof PRESTO_CATEGORIES[number];
export type Category = RoomServiceCategory | PrestoCategory;

// Helper to get categories by menu type
export const getCategoriesByMenu = (menu: 'presto' | 'room-service'): readonly string[] => {
    return menu === 'room-service' ? ROOM_SERVICE_CATEGORIES : PRESTO_CATEGORIES;
};

// Category display names (bilingual)
export const CATEGORY_NAMES: Record<string, { en: string; ar: string }> = {
    // Room Service Categories (17)
    'Breakfast': { en: 'Breakfast', ar: 'الفطور' },
    'Appetizers': { en: 'Appetizers', ar: 'مقبلات' },
    'Salads': { en: 'Salads', ar: 'سلطات' },
    'Sandwiches': { en: 'Sandwiches', ar: 'ساندويتشات' },
    'Burgers': { en: 'Burgers', ar: 'برجر' },
    'Pizza': { en: 'Pizza', ar: 'بيتزا' },
    'Pasta': { en: 'Pasta', ar: 'باستا' },
    'Seafood': { en: 'From the Sea', ar: 'المأكولات البحرية' },
    'Main Course': { en: 'Main Dishes', ar: 'الأطباق الرئيسية' },
    'Kids': { en: "Kid's Menu", ar: 'وجبات الأطفال' },
    'Desserts': { en: 'Desserts', ar: 'الحلويات' },
    'Beverages': { en: 'Fresh Juices', ar: 'عصائر طازجة' },
    'Smoothies': { en: 'Smoothies', ar: 'سموذي' },
    'Milkshakes': { en: 'Milkshakes', ar: 'ميلك شيك' },
    'Mocktails': { en: 'Mocktails', ar: 'موكتيلات' },
    'Chai Latte': { en: 'Chai Latte', ar: 'تشاي لاتيه' },
    'Refreshing Drinks': { en: 'Refreshing Drinks', ar: 'مشروبات منعشة' },

    // Presto-specific Categories
    'Hot Beverages': { en: 'Hot Beverages', ar: 'مشروبات ساخنة' },
    'Cold Beverages': { en: 'Cold Beverages', ar: 'مشروبات باردة' },
    'Frappes': { en: 'Frappes', ar: 'فرابتشينو' },
    'Fresh Juices': { en: 'Fresh Juices', ar: 'عصائر طازجة' },
    'Cocktails': { en: 'Cocktails', ar: 'كوكتيلات' },
    'Malt Beverages': { en: 'Malt Beverages', ar: 'مشروبات شعير' },
    'Italian Pasta': { en: 'Italian Pasta', ar: 'باستا إيطالية' },
    'Soups': { en: 'Soups', ar: 'شوربات' },
    'Risotto': { en: 'Risotto', ar: 'ريزوتو' },
    'Pizzeria Chez Nous': { en: 'Pizzeria Chez Nous', ar: 'بيتزا شينو' },
    'Sweets and Fruits': { en: 'Sweets & Fruits', ar: 'حلويات وفواكه' }
};

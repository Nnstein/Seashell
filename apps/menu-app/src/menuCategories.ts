// ===================================
// SHARED MENU CATEGORY DEFINITIONS
// ===================================
// This file defines categories for ALL menus: Presto, RoomSVC, and Seashell
// These definitions MUST match exactly what's in Firestore!

// RoomSVC Menu Categories (17 categories - matches seeding scripts)
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

// Seashell Menu Categories (Duplicate of Room Service initially)
export const SEASHELL_CATEGORIES = [
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
export type SeashellCategory = typeof SEASHELL_CATEGORIES[number];
export type Category = RoomServiceCategory | PrestoCategory | SeashellCategory;

// Helper to get categories by menu type
export const getCategoriesByMenu = (menu: 'presto' | 'room-service' | 'seashell'): readonly string[] => {
    if (menu === 'seashell') return SEASHELL_CATEGORIES;
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
    'Beverages': { en: 'Beverages', ar: 'مشروبات' },
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

// Category images (paths)
export const CATEGORY_IMAGES: Record<string, string> = {
    // Room Service
    'Breakfast': '/assets/images/categories/breakfast.jpg',
    'Appetizers': '/assets/images/categories/appetizers.jpg',
    'Salads': '/assets/images/categories/salads.jpg',
    'Sandwiches': '/assets/images/categories/main.jpg',
    'Burgers': '/assets/images/categories/main.jpg',
    'Pizza': '/assets/images/categories/pizza.jpg',
    'Pasta': '/assets/images/categories/pasta.jpg',
    'Seafood': '/assets/images/categories/main.jpg',
    'Main Course': '/assets/images/categories/main.jpg',
    'Kids': '/assets/images/categories/main.jpg',
    'Desserts': '/assets/images/categories/sweets.jpg',
    'Beverages': '/assets/images/categories/refreshing.jpg',
    'Smoothies': '/assets/images/categories/smoothies.jpg',
    'Milkshakes': '/assets/images/categories/milkshakes.jpg',
    'Mocktails': '/assets/images/categories/cocktails.jpg',
    'Chai Latte': '/assets/images/categories/hot.jpg',
    'Refreshing Drinks': '/assets/images/categories/refreshing.jpg',
    // Presto
    'Hot Beverages': '/assets/images/categories/hot.jpg',
    'Cold Beverages': '/assets/images/categories/cold.jpg',
    'Frappes': '/assets/images/categories/frappe.jpg',
    'Fresh Juices': '/assets/images/categories/fresh-juices.jpg',
    'Cocktails': '/assets/images/categories/cocktails.jpg',
    'Malt Beverages': '/assets/images/categories/malt.jpg',
    'Italian Pasta': '/assets/images/categories/pasta.jpg',
    'Soups': '/assets/images/categories/soups.jpg',
    'Risotto': '/assets/images/categories/risotto.jpg',
    'Pizzeria Chez Nous': '/assets/images/categories/pizza.jpg',
    'Sweets and Fruits': '/assets/images/categories/sweets.jpg'
};

// Category themes for styling
export const CATEGORY_THEMES: Record<string, { textColor: string; accentColor: string }> = {
    // Room Service
    'Breakfast': { textColor: 'text-amber-100', accentColor: 'bg-amber-500' },
    'Appetizers': { textColor: 'text-orange-100', accentColor: 'bg-orange-600' },
    'Salads': { textColor: 'text-green-100', accentColor: 'bg-green-600' },
    'Sandwiches': { textColor: 'text-yellow-100', accentColor: 'bg-yellow-700' },
    'Burgers': { textColor: 'text-red-100', accentColor: 'bg-red-700' },
    'Pizza': { textColor: 'text-red-100', accentColor: 'bg-red-600' },
    'Pasta': { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    'Seafood': { textColor: 'text-blue-100', accentColor: 'bg-blue-600' },
    'Main Course': { textColor: 'text-emerald-100', accentColor: 'bg-emerald-700' },
    'Kids': { textColor: 'text-pink-100', accentColor: 'bg-pink-500' },
    'Desserts': { textColor: 'text-rose-100', accentColor: 'bg-rose-500' },
    'Beverages': { textColor: 'text-orange-100', accentColor: 'bg-orange-500' },
    'Smoothies': { textColor: 'text-green-100', accentColor: 'bg-green-500' },
    'Milkshakes': { textColor: 'text-pink-100', accentColor: 'bg-pink-500' },
    'Mocktails': { textColor: 'text-purple-100', accentColor: 'bg-purple-600' },
    'Chai Latte': { textColor: 'text-amber-100', accentColor: 'bg-amber-600' },
    'Refreshing Drinks': { textColor: 'text-teal-100', accentColor: 'bg-teal-500' },
    // Presto
    'Hot Beverages': { textColor: 'text-amber-100', accentColor: 'bg-amber-600' },
    'Cold Beverages': { textColor: 'text-cyan-100', accentColor: 'bg-cyan-600' },
    'Frappes': { textColor: 'text-pink-100', accentColor: 'bg-pink-600' },
    'Fresh Juices': { textColor: 'text-orange-100', accentColor: 'bg-orange-500' },
    'Cocktails': { textColor: 'text-purple-100', accentColor: 'bg-purple-600' },
    'Malt Beverages': { textColor: 'text-yellow-100', accentColor: 'bg-yellow-700' },
    'Italian Pasta': { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    'Soups': { textColor: 'text-amber-100', accentColor: 'bg-amber-700' },
    'Risotto': { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    'Pizzeria Chez Nous': { textColor: 'text-red-100', accentColor: 'bg-red-600' },
    'Sweets and Fruits': { textColor: 'text-rose-100', accentColor: 'bg-rose-500' }
};

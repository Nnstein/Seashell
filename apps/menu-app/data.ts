import { CategoryData } from './src/types';
import {
  ROOM_SERVICE_CATEGORIES,
  PRESTO_CATEGORIES,
  SEASHELL_CATEGORIES,
  CATEGORY_NAMES,
  CATEGORY_IMAGES,
  CATEGORY_THEMES,
  getCategoriesByMenu
} from './src/menuCategories';

// Asset Paths
const ASSETS = {
  landing: '/assets/landing/room-service-bg.jpg',
  beachLanding: '/assets/landing/beach-bg.png',
};

export const LANDING_IMAGE = ASSETS.landing;
export const BEACH_LANDING_IMAGE = ASSETS.beachLanding;

export const UI_TEXT = {
  viewMenu: { en: "View Menu", ar: "قائمة الطعام" },
  enterRoom: { en: "Enter Room Number", ar: "أدخل رقم الغرفة" },
  enterPhone: { en: "Enter Phone Number", ar: "أدخل رقم الهاتف" },
  enterRoomPrompt: { en: "Please enter your room number to order", ar: "الرجاء إدخال رقم الغرفة للطلب" },
  roomNumber: { en: "Room Number", ar: "رقم الغرفة" },
  phoneNumber: { en: "Phone Number", ar: "رقم الهاتف" },
  myOrder: { en: "My Order", ar: "طلباتي" },
  items: { en: "items", ar: "عناصر" },
  total: { en: "Total", ar: "المجموع" },
  placeOrder: { en: "Place Order", ar: "تأكيد الطلب" },
  yourOrderEmpty: { en: "Your order is empty", ar: "سلة الطلبات فارغة" },
  exploreMenu: { en: "Explore our menu and add some delicious items.", ar: "تصفح القائمة وأضف بعض الأصناف اللذيذة." },
  orderReceived: { en: "Order Received!", ar: "تم استلام الطلب!" },
  orderMsg: { en: "Your selection is being prepared. We will deliver to your room shortly.", ar: "يتم تحضير طلبك. سنقوم بالتوصيل لغرفتك قريباً." },
  receipt: { en: "Receipt", ar: "الفاتورة" },
  orderNumber: { en: "Order Number", ar: "رقم الطلب" },
  itemsOrdered: { en: "Items Ordered", ar: "العناصر المطلوبة" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  serviceCharge: { en: "Service Charge", ar: "رسوم الخدمة" },
  totalPaid: { en: "Total", ar: "الإجمالي" },
  startNew: { en: "Back to Home", ar: "العودة للرئيسية" },
  experienceTaste: { en: "Experience the Taste", ar: "تذوق الفخامة" },
  welcomeTitle: { en: "Seashell F&B", ar: "سي شيل للمأكولات والمشروبات" },
  welcomeSubtitle: { en: "", ar: "" }
};

// Helper function to build CategoryData from category ID
const buildCategoryData = (categoryId: string): CategoryData => ({
  id: categoryId,
  name: CATEGORY_NAMES[categoryId] || { en: categoryId, ar: categoryId },
  image: CATEGORY_IMAGES[categoryId] || '/assets/images/categories/main.jpg',
  images: [CATEGORY_IMAGES[categoryId] || '/assets/images/categories/main.jpg'],
  video: undefined,
  theme: CATEGORY_THEMES[categoryId] || { textColor: 'text-stone-100', accentColor: 'bg-stone-600' },
  items: []
});

// Generate MENU_DATA for Room Service (default)
export const ROOM_SERVICE_MENU_DATA: CategoryData[] = ROOM_SERVICE_CATEGORIES.map(buildCategoryData);

// Generate MENU_DATA for Presto
export const PRESTO_MENU_DATA: CategoryData[] = PRESTO_CATEGORIES.map(buildCategoryData);

// Generate MENU_DATA for Seashell
export const SEASHELL_MENU_DATA: CategoryData[] = SEASHELL_CATEGORIES.map(buildCategoryData);

// Default export - Room Service (since that's the primary use case now)
// The app should use getMenuDataByType for dynamic menu switching
export const MENU_DATA = ROOM_SERVICE_MENU_DATA;

// Helper to get menu data by type
export const getMenuDataByType = (menuType: 'presto' | 'room-service' | 'seashell'): CategoryData[] => {
  if (menuType === 'seashell') return SEASHELL_MENU_DATA;
  return menuType === 'room-service' ? ROOM_SERVICE_MENU_DATA : PRESTO_MENU_DATA;
};

// Re-export for convenience
export { getCategoriesByMenu, CATEGORY_NAMES, CATEGORY_IMAGES, CATEGORY_THEMES };
import { Category, LocalizedString, CategoryData } from './types';

// Helper to generate image URLs
const getImg = (id: number) => `https://picsum.photos/400/300?random=${id}`;

// Landing Background Image (Distinct from Hot Beverages)
export const LANDING_IMAGE = "https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2832&auto=format&fit=crop";

export const UI_TEXT = {
  viewMenu: { en: "View Menu", ar: "قائمة الطعام" },
  enterRoom: { en: "Enter Room Number", ar: "أدخل رقم الغرفة" },
  enterRoomPrompt: { en: "Please enter your room number to order", ar: "الرجاء إدخال رقم الغرفة للطلب" },
  roomNumber: { en: "Room Number", ar: "رقم الغرفة" },
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
  welcomeTitle: { en: "Presto Coffee & More", ar: "بريستو كوفي وأكثر" },
  welcomeSubtitle: { en: "A symphony of flavors, crafted for moments of pure delight.", ar: "سيمفونية من النكهات، صُنعت لتبقى في الذاكرة." }
};

// Specific images for categories
const catImages = {
  hot: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
  // New working Cold Beverage Image
  cold: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  frappe: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
  appetizers: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  pasta: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80",
  main: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80",
  sweets: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80"
};

// Video backgrounds
const catVideos = {
  hot: "https://videos.pexels.com/video-files/855018/855018-hd_1920_1080_30fps.mp4",
  cold: "https://videos.pexels.com/video-files/4109396/4109396-uhd_2560_1440_25fps.mp4",
  frappe: "https://videos.pexels.com/video-files/3007262/3007262-hd_1920_1080_24fps.mp4",
  appetizers: "https://videos.pexels.com/video-files/5634926/5634926-uhd_3840_2160_24fps.mp4",
  pizza: "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4",
  pasta: "https://videos.pexels.com/video-files/3209663/3209663-uhd_2560_1440_25fps.mp4",
  main: "https://videos.pexels.com/video-files/4253255/4253255-uhd_3840_2160_30fps.mp4",
  sweets: "https://videos.pexels.com/video-files/4689866/4689866-uhd_3840_2160_25fps.mp4"
};

export const MENU_DATA: CategoryData[] = [
  {
    id: 'Hot Beverages',
    name: { en: 'Hot Beverages', ar: 'مشروبات ساخنة' },
    image: catImages.hot,
    images: [
      catImages.hot,
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.hot,
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-600' },
    items: []
  },
  {
    id: 'Cold Beverages',
    name: { en: 'Cold Beverages', ar: 'مشروبات باردة' },
    image: catImages.cold,
    images: [
      catImages.cold,
      "https://images.unsplash.com/photo-1499961024600-ad094db305cc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold,
    theme: { textColor: 'text-cyan-100', accentColor: 'bg-cyan-600' },
    items: []
  },
  {
    id: 'Frappes',
    name: { en: "Frappes", ar: "فرابتشينو" },
    image: catImages.frappe,
    images: [
      catImages.frappe,
      "https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.frappe,
    theme: { textColor: 'text-pink-100', accentColor: 'bg-pink-600' },
    items: []
  },
  {
    id: 'Smoothies',
    name: { en: 'Smoothies', ar: 'عصائر سموذي' },
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553530666-ba11a90654f3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold, // Fallback
    theme: { textColor: 'text-green-100', accentColor: 'bg-green-500' },
    items: []
  },
  {
    id: 'Milkshakes',
    name: { en: 'Milkshakes', ar: 'ميلك شيك' },
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.frappe, // Fallback
    theme: { textColor: 'text-pink-100', accentColor: 'bg-pink-500' },
    items: []
  },
  {
    id: 'Fresh Juices',
    name: { en: 'Fresh Juices', ar: 'عصائر طازجة' },
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold, // Fallback
    theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-500' },
    items: []
  },
  {
    id: 'Cocktails',
    name: { en: 'Cocktails', ar: 'كوكتيلات' },
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1536935338788-843bb5285246?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold, // Fallback
    theme: { textColor: 'text-purple-100', accentColor: 'bg-purple-600' },
    items: []
  },
  {
    id: 'Malt Beverages',
    name: { en: 'Malt Beverages', ar: 'مشروبات شعير' },
    image: "https://images.unsplash.com/photo-1606759368364-82a1792614b8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1606759368364-82a1792614b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586996292898-71f4036c4e40?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold, // Fallback
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-700' },
    items: []
  },
  {
    id: 'Refreshing Drinks',
    name: { en: 'Refreshing Drinks', ar: 'مشروبات منعشة' },
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499961024600-ad094db305cc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.cold, // Fallback
    theme: { textColor: 'text-teal-100', accentColor: 'bg-teal-500' },
    items: []
  },
  {
    id: 'Appetizers',
    name: { en: 'Appetizers', ar: 'مقبلات' },
    image: catImages.appetizers,
    images: [
      catImages.appetizers,
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606850780554-b55ea2ce98e7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515516947383-57443e908864?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.appetizers,
    theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-600' },
    items: []
  },
  {
    id: 'Italian Pasta',
    name: { en: 'Italian Pasta', ar: 'باستا إيطالية' },
    image: catImages.pasta,
    images: [
      catImages.pasta,
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608835291093-394b0c943a75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.pasta,
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    items: []
  },
  {
    id: 'Soups',
    name: { en: 'Soups', ar: 'شوربات' },
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626015449722-1d55ee26163e?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.appetizers, // Fallback
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-700' },
    items: []
  },
  {
    id: 'Salads',
    name: { en: 'Salads', ar: 'سلطات' },
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.appetizers, // Fallback
    theme: { textColor: 'text-green-100', accentColor: 'bg-green-600' },
    items: []
  },
  {
    id: 'Risotto',
    name: { en: 'Risotto', ar: 'ريزوتو' },
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.main, // Fallback
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    items: []
  },
  {
    id: 'Pizzeria Chez Nous',
    name: { en: 'Pizzeria Chez Nous', ar: 'بيتزا شينو' },
    image: catImages.pizza,
    images: [
      catImages.pizza,
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1593560708920-63984a6d6d4e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.pizza,
    theme: { textColor: 'text-red-100', accentColor: 'bg-red-600' },
    items: []
  },
  {
    id: 'Main Course',
    name: { en: 'Main Course', ar: 'الطبق الرئيسي' },
    image: catImages.main,
    images: [
      catImages.main,
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.main,
    theme: { textColor: 'text-emerald-100', accentColor: 'bg-emerald-700' },
    items: []
  },
  {
    id: 'Sweets and Fruits',
    name: { en: 'Sweets & Fruits', ar: 'حلويات وفواكه' },
    image: catImages.sweets,
    images: [
      catImages.sweets,
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1488477181946-6428a029177b?auto=format&fit=crop&w=1200&q=80"
    ],
    video: catVideos.sweets,
    theme: { textColor: 'text-rose-100', accentColor: 'bg-rose-500' },
    items: []
  }
];
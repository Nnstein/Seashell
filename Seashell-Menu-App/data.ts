import { Category, LocalizedString, CategoryData } from './types';

// Asset Paths (Local where available, Remote fallback for videos)
const ASSETS = {
  landing: '/assets/landing/landing.jpg',
  categories: {
    hot: '/assets/images/categories/hot.jpg',
    cold: '/assets/images/categories/cold.jpg',
    frappe: '/assets/images/categories/frappe.jpg',
    appetizers: '/assets/images/categories/appetizers.jpg',
    pizza: '/assets/images/categories/pizza.jpg',
    pasta: '/assets/images/categories/pasta.jpg',
    main: '/assets/images/categories/main.jpg',
    sweets: '/assets/images/categories/sweets.jpg',
    smoothies: '/assets/images/categories/smoothies.jpg',
    milkshakes: '/assets/images/categories/milkshakes.jpg',
    freshJuices: '/assets/images/categories/fresh-juices.jpg',
    cocktails: '/assets/images/categories/cocktails.jpg',
    refreshing: '/assets/images/categories/refreshing.jpg',
    soups: '/assets/images/categories/soups.jpg',
    salads: '/assets/images/categories/salads.jpg',
    risotto: '/assets/images/categories/risotto.jpg',
    breakfast: '/assets/images/categories/breakfast.jpg',
    malt: '/assets/images/categories/malt.jpg'
  },
  items: {
    // Breakfast items
    bk1: '/assets/images/items/bk-1.jpg',
    bk2: '/assets/images/items/bk-2.jpg',
    bk3: '/assets/images/items/bk-3.jpg',
    bk4: '/assets/images/items/bk-4.jpg',
    bk5: '/assets/images/items/bk-5.jpg',
    bk6: '/assets/images/items/bk-6.jpg',
    bk7: '/assets/images/items/bk-7.jpg',
    bk10: '/assets/images/items/bk-10.jpg',
    bk11: '/assets/images/items/bk-11.jpg',
    bk12: '/assets/images/items/bk-12.jpg'
  },
  videos: {
    pasta: '/assets/videos/pasta.mp4',
    // Remote fallbacks for failed downloads
    hot: "https://videos.pexels.com/video-files/855018/855018-hd_1920_1080_30fps.mp4",
    cold: "https://videos.pexels.com/video-files/4109396/4109396-uhd_2560_1440_25fps.mp4",
    frappe: "https://videos.pexels.com/video-files/3007262/3007262-hd_1920_1080_24fps.mp4",
    appetizers: "https://videos.pexels.com/video-files/5634926/5634926-uhd_3840_2160_24fps.mp4",
    pizza: "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4",
    main: "https://videos.pexels.com/video-files/4253255/4253255-uhd_3840_2160_30fps.mp4",
    sweets: "https://videos.pexels.com/video-files/4689866/4689866-uhd_3840_2160_25fps.mp4",
    breakfast: "https://videos.pexels.com/video-files/2941916/2941916-uhd_2560_1440_24fps.mp4",
  }
};

export const LANDING_IMAGE = ASSETS.landing;

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

// Category Images Map
const catImages = {
  hot: ASSETS.categories.hot,
  cold: ASSETS.categories.cold,
  frappe: ASSETS.categories.frappe,
  appetizers: ASSETS.categories.appetizers,
  pizza: ASSETS.categories.pizza,
  pasta: ASSETS.categories.pasta,
  main: ASSETS.categories.main,
  sweets: ASSETS.categories.sweets
};

// Category Videos Map
const catVideos = {
  hot: ASSETS.videos.hot,
  cold: ASSETS.videos.cold,
  frappe: ASSETS.videos.frappe,
  appetizers: ASSETS.videos.appetizers,
  pizza: ASSETS.videos.pizza,
  pasta: ASSETS.videos.pasta,
  main: ASSETS.videos.main,
  sweets: ASSETS.videos.sweets
};

export const MENU_DATA: CategoryData[] = [
  {
    id: 'Breakfast',
    name: { en: 'Breakfast', ar: 'الفطور' },
    image: ASSETS.categories.breakfast,
    images: [
      ASSETS.categories.breakfast,
      "https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496042399014-dc73cbb3bce8?auto=format&fit=crop&w=1200&q=80"
    ],
    video: ASSETS.videos.breakfast,
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-500' },
    items: [
      {
        id: 'bk-1',
        name: { en: 'Seashell Breakfast', ar: 'إفطار سي شيل' },
        description: {
          en: 'Brewed tea or coffee, orange juice, freshly baked croissant, danish, bread rolls and toast, butter and jams, cereal, muesli, yogurt, cheeses, eggs cooked your way, fresh fruits, bacon, sausages, potato, tomato, and mushrooms.',
          ar: 'شاي أو قهوة، عصير برتقال، كرواسون طازج، دانيش، خبز محمص، زبدة ومربى، حبوب، موسلي، زبادي، أجبان، بيض حسب اختيارك، فواكه طازجة، لحم مقدد، نقانق، بطاطس، طماطم وفطر.'
        },
        price: 6.000,
        category: 'Breakfast',
        image: ASSETS.items.bk1
      },
      {
        id: 'bk-2',
        name: { en: 'Mediterranean Breakfast', ar: 'إفطار متوسطي' },
        description: {
          en: 'Brewed tea or coffee, orange juice, freshly baked pastries with honey, jam and butter, hummus, white cheese, labneh, tomato, cucumber, olives and pickles, cold cuts, foul, boiled eggs, falafel, and eggs cooked your way.',
          ar: 'شاي أو قهوة، عصير برتقال، معجنات طازجة مع عسل ومربى وزبدة، حمص، جبنة بيضاء، لبنة، طماطم، خيار، زيتون ومخللات، لحوم باردة، فول، بيض مسلوق، فلافل، وبيض حسب اختيارك.'
        },
        price: 5.500,
        category: 'Breakfast',
        image: ASSETS.items.bk2
      },
      {
        id: 'bk-3',
        name: { en: 'Eggs', ar: 'بيض' },
        description: {
          en: 'Eggs cooked your way served with beef bacon, chicken sausages, potatoes, peppers, tomatoes, and mushroom.',
          ar: 'بيض مطهو حسب رغبتك يقدم مع لحم بقري مقدد، نقانق دجاج، بطاطس، فلفل، طماطم وفطر.'
        },
        price: 2.000,
        category: 'Breakfast',
        image: ASSETS.items.bk3
      },
      {
        id: 'bk-4',
        name: { en: 'Cheese Plate', ar: 'طبق أجبان' },
        description: {
          en: 'A selection of international cheeses served with a freshly baked bread basket.',
          ar: 'تشكيلة من الأجبان العالمية تقدم مع سلة خبز طازج.'
        },
        price: 3.000,
        category: 'Breakfast',
        image: ASSETS.items.bk4
      },
      {
        id: 'bk-5',
        name: { en: 'Pastry Basket', ar: 'سلة معجنات' },
        description: {
          en: 'Croissant, assorted Danish, and cinnamon roll.',
          ar: 'كرواسون، تشكيلة دانيش، ولفائف القرفة.'
        },
        price: 2.750,
        category: 'Breakfast',
        image: ASSETS.items.bk5
      },
      {
        id: 'bk-6',
        name: { en: 'Baguette', ar: 'باغيت' },
        description: { en: 'Freshly baked baguette.', ar: 'خبز باغيت طازج.' },
        price: 1.100,
        category: 'Breakfast',
        image: ASSETS.items.bk6
      },
      {
        id: 'bk-7',
        name: { en: 'Kraft Corn Loaf', ar: 'خبز الذرة كرافت' },
        description: { en: 'Freshly baked corn loaf.', ar: 'خبز الذرة الطازج.' },
        price: 1.250,
        category: 'Breakfast',
        image: ASSETS.items.bk7
      },
      {
        id: 'bk-8',
        name: { en: 'Multi Cereal Loaf', ar: 'خبز الحبوب المتعددة' },
        description: { en: 'Healthy multi-cereal loaf.', ar: 'خبز صحي متعدد الحبوب.' },
        price: 1.250,
        category: 'Breakfast',
        image: ASSETS.items.bk7 // Reuse bk7 image
      },
      {
        id: 'bk-9',
        name: { en: 'Country Loaf', ar: 'خبز ريفي' },
        description: { en: 'Classic country style loaf.', ar: 'خبز على الطريقة الريفية.' },
        price: 1.250,
        category: 'Breakfast',
        image: ASSETS.items.bk7 // Reuse bk7 image
      },
      {
        id: 'bk-10',
        name: { en: 'Pancakes & Waffles', ar: 'بان كيك ووافل' },
        description: {
          en: 'Choose between pancakes or waffles with either maple syrup, strawberries or chocolate sauce and fruits.',
          ar: 'اختر بين البان كيك أو الوافل مع شراب القيقب، الفراولة أو صلصة الشوكولاتة والفواكه.'
        },
        price: 3.500,
        category: 'Breakfast',
        image: ASSETS.items.bk10
      },
      {
        id: 'bk-11',
        name: { en: 'Cereal', ar: 'حبوب الإفطار' },
        description: {
          en: 'Your choice of cornflakes, rice krispies, all bran or muesli. Served with cold or hot milk.',
          ar: 'اختيارك من الكورن فليكس، رايس كريسبي، أول بران أو موسلي. يقدم مع حليب بارد أو ساخن.'
        },
        price: 1.750,
        category: 'Breakfast',
        image: ASSETS.items.bk11
      },
      {
        id: 'bk-12',
        name: { en: 'Fresh Fruits', ar: 'فواكه طازجة' },
        description: {
          en: 'A platter of fresh cut seasonal fruits.',
          ar: 'طبق من الفواكه الموسمية المقطعة طازجة.'
        },
        price: 1.500,
        category: 'Breakfast',
        image: ASSETS.items.bk12
      }
    ]
  },
  {
    id: 'Hot Beverages',
    name: { en: 'Hot Beverages', ar: 'مشروبات ساخنة' },
    image: catImages.hot,
    images: [catImages.hot],
    video: catVideos.hot,
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-600' },
    items: []
  },
  {
    id: 'Cold Beverages',
    name: { en: 'Cold Beverages', ar: 'مشروبات باردة' },
    image: catImages.cold,
    images: [catImages.cold],
    video: catVideos.cold,
    theme: { textColor: 'text-cyan-100', accentColor: 'bg-cyan-600' },
    items: []
  },
  {
    id: 'Frappes',
    name: { en: "Frappes", ar: "فرابتشينو" },
    image: catImages.frappe,
    images: [catImages.frappe],
    video: catVideos.frappe,
    theme: { textColor: 'text-pink-100', accentColor: 'bg-pink-600' },
    items: []
  },
  {
    id: 'Smoothies',
    name: { en: 'Smoothies', ar: 'عصائر سموذي' },
    image: ASSETS.categories.smoothies,
    images: [ASSETS.categories.smoothies],
    video: catVideos.cold,
    theme: { textColor: 'text-green-100', accentColor: 'bg-green-500' },
    items: []
  },
  {
    id: 'Milkshakes',
    name: { en: 'Milkshakes', ar: 'ميلك شيك' },
    image: ASSETS.categories.milkshakes,
    images: [ASSETS.categories.milkshakes],
    video: catVideos.frappe,
    theme: { textColor: 'text-pink-100', accentColor: 'bg-pink-500' },
    items: []
  },
  {
    id: 'Fresh Juices',
    name: { en: 'Fresh Juices', ar: 'عصائر طازجة' },
    image: ASSETS.categories.freshJuices,
    images: [ASSETS.categories.freshJuices],
    video: catVideos.cold,
    theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-500' },
    items: []
  },
  {
    id: 'Cocktails',
    name: { en: 'Cocktails', ar: 'كوكتيلات' },
    image: ASSETS.categories.cocktails,
    images: [ASSETS.categories.cocktails],
    video: catVideos.cold,
    theme: { textColor: 'text-purple-100', accentColor: 'bg-purple-600' },
    items: []
  },
  {
    id: 'Malt Beverages',
    name: { en: 'Malt Beverages', ar: 'مشروبات شعير' },
    image: ASSETS.categories.malt,
    images: [ASSETS.categories.malt],
    video: catVideos.cold,
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-700' },
    items: []
  },
  {
    id: 'Refreshing Drinks',
    name: { en: 'Refreshing Drinks', ar: 'مشروبات منعشة' },
    image: ASSETS.categories.refreshing,
    images: [ASSETS.categories.refreshing],
    video: catVideos.cold,
    theme: { textColor: 'text-teal-100', accentColor: 'bg-teal-500' },
    items: []
  },
  {
    id: 'Appetizers',
    name: { en: 'Appetizers', ar: 'مقبلات' },
    image: catImages.appetizers,
    images: [catImages.appetizers],
    video: catVideos.appetizers,
    theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-600' },
    items: []
  },
  {
    id: 'Italian Pasta',
    name: { en: 'Italian Pasta', ar: 'باستا إيطالية' },
    image: catImages.pasta,
    images: [catImages.pasta],
    video: catVideos.pasta,
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    items: []
  },
  {
    id: 'Soups',
    name: { en: 'Soups', ar: 'شوربات' },
    image: ASSETS.categories.soups,
    images: [ASSETS.categories.soups],
    video: catVideos.appetizers,
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-700' },
    items: []
  },
  {
    id: 'Salads',
    name: { en: 'Salads', ar: 'سلطات' },
    image: ASSETS.categories.salads,
    images: [ASSETS.categories.salads],
    video: catVideos.appetizers,
    theme: { textColor: 'text-green-100', accentColor: 'bg-green-600' },
    items: []
  },
  {
    id: 'Risotto',
    name: { en: 'Risotto', ar: 'ريزوتو' },
    image: ASSETS.categories.risotto,
    images: [ASSETS.categories.risotto],
    video: catVideos.main,
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    items: []
  },
  {
    id: 'Pizzeria Chez Nous',
    name: { en: 'Pizzeria Chez Nous', ar: 'بيتزا شينو' },
    image: catImages.pizza,
    images: [catImages.pizza],
    video: catVideos.pizza,
    theme: { textColor: 'text-red-100', accentColor: 'bg-red-600' },
    items: []
  },
  {
    id: 'Main Course',
    name: { en: 'Main Course', ar: 'الطبق الرئيسي' },
    image: catImages.main,
    images: [catImages.main],
    video: catVideos.main,
    theme: { textColor: 'text-emerald-100', accentColor: 'bg-emerald-700' },
    items: []
  },
  {
    id: 'Sweets and Fruits',
    name: { en: 'Sweets & Fruits', ar: 'حلويات وفواكه' },
    image: catImages.sweets,
    images: [catImages.sweets],
    video: catVideos.sweets,
    theme: { textColor: 'text-rose-100', accentColor: 'bg-rose-500' },
    items: []
  }
];
import { Category, LocalizedString } from './types';

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

export const MENU_DATA: Category[] = [
  {
    id: 'hot-beverages',
    name: { en: 'Hot Beverages', ar: 'مشروبات ساخنة' },
    image: catImages.hot,
    video: catVideos.hot,
    theme: { textColor: 'text-amber-100', accentColor: 'bg-amber-600' },
    items: [
      { id: 'hb1', name: { en: 'Espresso', ar: 'اسبريسو' }, price: 1.000, category: 'Hot Beverages', image: getImg(1), description: { en: 'Single shot of rich coffee', ar: 'جرعة واحدة من القهوة الغنية' } },
      { id: 'hb2', name: { en: 'Cappuccino', ar: 'كابتشينو' }, price: 1.500, category: 'Hot Beverages', image: getImg(2), description: { en: 'Espresso with steamed milk foam', ar: 'اسبريسو مع رغوة الحليب المبخر' } },
      { id: 'hb3', name: { en: 'Latte', ar: 'لاتيه' }, price: 1.500, category: 'Hot Beverages', image: getImg(3), description: { en: 'Espresso with steamed milk', ar: 'اسبريسو مع حليب مبخر' } },
      { id: 'hb4', name: { en: 'Flat White', ar: 'فلات وايت' }, price: 1.500, category: 'Hot Beverages', image: getImg(4), description: { en: 'Micro-foam milk over espresso', ar: 'رغوة خفيفة فوق الاسبريسو' } },
      { id: 'hb5', name: { en: 'Caramel Macchiato', ar: 'كراميل ماكياتو' }, price: 1.750, category: 'Hot Beverages', image: getImg(5), description: { en: 'Vanilla syrup, steamed milk, espresso, caramel drizzle', ar: 'شراب الفانيليا، حليب مبخر، اسبريسو، وصلصة الكراميل' } },
      { id: 'hb6', name: { en: 'Hot Chocolate', ar: 'شوكولاتة ساخنة' }, price: 1.500, category: 'Hot Beverages', image: getImg(6), description: { en: 'Classic rich cocoa', ar: 'كاكاو غني كلاسيكي' } },
    ]
  },
  {
    id: 'cold-beverages',
    name: { en: 'Cold Beverages', ar: 'مشروبات باردة' },
    image: catImages.cold,
    video: catVideos.cold,
    theme: { textColor: 'text-cyan-100', accentColor: 'bg-cyan-600' },
    items: [
      { id: 'cb1', name: { en: 'Iced Caffe Americano', ar: 'آيس كافيه أمريكانو' }, price: 1.750, category: 'Cold Beverages', image: getImg(8), description: { en: 'Espresso over ice and water', ar: 'اسبريسو مع ثلج وماء' } },
      { id: 'cb2', name: { en: 'Iced Caffe Latte', ar: 'آيس كافيه لاتيه' }, price: 1.950, category: 'Cold Beverages', image: getImg(9), description: { en: 'Espresso and cold milk over ice', ar: 'اسبريسو وحليب بارد مع ثلج' } },
      { id: 'cb3', name: { en: 'Iced Mocha', ar: 'آيس موكا' }, price: 2.000, category: 'Cold Beverages', image: getImg(10), description: { en: 'Espresso, chocolate sauce, milk and ice', ar: 'اسبريسو، صوص شوكولاتة، حليب وثلج' } },
      { id: 'cb4', name: { en: 'Iced Caramel Macchiato', ar: 'آيس كراميل ماكياتو' }, price: 2.000, category: 'Cold Beverages', image: getImg(11), description: { en: 'Iced espresso with caramel and milk', ar: 'اسبريسو مثلج مع كراميل وحليب' } },
    ]
  },
  {
    id: 'frappe',
    name: { en: "Frappe's", ar: "فرابتشينو" },
    image: catImages.frappe,
    video: catVideos.frappe,
    theme: { textColor: 'text-pink-100', accentColor: 'bg-pink-600' },
    items: [
      { id: 'fr1', name: { en: 'Caramel Frappé', ar: 'كراميل فرابيه' }, price: 2.250, category: "Frappe's", image: getImg(13), description: { en: 'Blended ice coffee with caramel', ar: 'قهوة مثلجة مخلوطة مع الكراميل' } },
      { id: 'fr2', name: { en: 'Choco Frappé', ar: 'تشوكو فرابيه' }, price: 2.250, category: "Frappe's", image: getImg(14), description: { en: 'Rich chocolate blended ice drink', ar: 'مشروب مثلج غني بالشوكولاتة' } },
      { id: 'fr3', name: { en: 'Strawberry Frappé', ar: 'فرولة فرابيه' }, price: 2.250, category: "Frappe's", image: getImg(15), description: { en: 'Sweet strawberry blend', ar: 'مزيج الفراولة الحلو' } },
    ]
  },
  {
    id: 'appetizers',
    name: { en: 'Appetizers', ar: 'مقبلات' },
    image: catImages.appetizers,
    video: catVideos.appetizers,
    theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-600' },
    items: [
      { id: 'ap1', name: { en: 'Bruschetta', ar: 'بروشيتا' }, price: 2.250, category: 'Appetizers', image: getImg(17), description: { en: 'Oven baked sliced bread, topped with tomato, basil', ar: 'خبز محمص بالفرن، مغطى بالطماطم والريحان' } },
      { id: 'ap2', name: { en: 'Mozzarella Sticks', ar: 'أصابع الموزاريلا' }, price: 2.000, category: 'Appetizers', image: getImg(18), description: { en: '5 pcs of cheese sticks with pomodoro sauce', ar: '٥ قطع من أصابع الجبن مع صلصة البومودورو' } },
      { id: 'ap3', name: { en: 'Arancini', ar: 'أرانسيني' }, price: 2.500, category: 'Appetizers', image: getImg(19), description: { en: 'Served with tomato and basil sauce', ar: 'تقدم مع صلصة الطماطم والريحان' } },
    ]
  },
  {
    id: 'pizza',
    name: { en: 'Pizzeria Chez Nous', ar: 'بيتزا شينو' },
    image: catImages.pizza,
    video: catVideos.pizza,
    theme: { textColor: 'text-red-100', accentColor: 'bg-red-600' },
    items: [
      { id: 'pz1', name: { en: 'Margherita', ar: 'مارغريتا' }, price: 3.250, category: 'Pizza', image: getImg(21), description: { en: 'Tomato Sauce, Mozzarella Cheese', ar: 'صلصة طماطم، جبنة موزاريلا' } },
      { id: 'pz2', name: { en: 'Quattro Stagioni', ar: 'كواترو ستاجيوني' }, price: 3.500, category: 'Pizza', image: getImg(22), description: { en: 'Tomato Sauce, Mozzarella, Mushrooms', ar: 'صلصة طماطم، موزاريلا، فطر' } },
      { id: 'pz3', name: { en: 'Pepperoni', ar: 'بيبروني' }, price: 4.000, category: 'Pizza', image: getImg(23), description: { en: 'Tomato Sauce, Mozzarella Cheese, Pepperoni', ar: 'صلصة طماطم، موزاريلا، بيبروني' } },
    ]
  },
  {
    id: 'pasta',
    name: { en: 'Italian Pasta', ar: 'باستا إيطالية' },
    image: catImages.pasta,
    video: catVideos.pasta,
    theme: { textColor: 'text-yellow-100', accentColor: 'bg-yellow-600' },
    items: [
      { id: 'pt1', name: { en: 'Penne Allarrabbiata', ar: 'بيني أرابياتا' }, price: 3.500, category: 'Pasta', image: getImg(25), description: { en: 'Tomato Sauce, Garlic, Crushed Chilly', ar: 'صلصة طماطم، ثوم، فلفل حار' } },
      { id: 'pt2', name: { en: 'Spaghetti alla Bolognese', ar: 'سباغيتي بولونيز' }, price: 4.000, category: 'Pasta', image: getImg(26), description: { en: 'Tomato Sauce, Minced Beef Meat', ar: 'صلصة طماطم، لحم بقري مفروم' } },
    ]
  },
  {
    id: 'main-course',
    name: { en: 'Main Course', ar: 'الطبق الرئيسي' },
    image: catImages.main,
    video: catVideos.main,
    theme: { textColor: 'text-emerald-100', accentColor: 'bg-emerald-700' },
    items: [
      { id: 'mc1', name: { en: 'Pollo ai Funghi', ar: 'بولو أي فونغي' }, price: 4.500, category: 'Main Course', image: getImg(29), description: { en: 'Oven roasted chicken Breast with mushroom', ar: 'صدور دجاج مشوية بالفرن مع الفطر' } },
      { id: 'mc2', name: { en: 'Carne al Forno', ar: 'كارني ال فورنو' }, price: 6.000, category: 'Main Course', image: getImg(30), description: { en: 'Veal Tenderloin, with sauteed green beans', ar: 'تندرلوين العجل، مع فاصوليا خضراء سوتيه' } },
    ]
  },
  {
    id: 'sweets',
    name: { en: 'Sweets & Fruits', ar: 'حلويات وفواكه' },
    image: catImages.sweets,
    video: catVideos.sweets,
    theme: { textColor: 'text-rose-100', accentColor: 'bg-rose-500' },
    items: [
      { id: 'sw1', name: { en: 'Philadelphia Cheesecake', ar: 'تشيز كيك فيلادلفيا' }, price: 2.250, category: 'Sweets', image: getImg(33), description: { en: 'Homemade creamy cheesecake', ar: 'تشيز كيك كريمي منزلي الصنع' } },
      { id: 'sw2', name: { en: 'Chocolate Brownies', ar: 'براونيز شوكولاتة' }, price: 2.250, category: 'Sweets', image: getImg(34), description: { en: 'Homemade rich chocolate brownies', ar: 'براونيز شوكولاتة غنية منزلية الصنع' } },
    ]
  }
];
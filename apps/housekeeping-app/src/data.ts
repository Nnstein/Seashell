import { CategoryData } from './types';

// Placeholder images (using Unsplash for now)
const catImages = {
    bedroom: "https://images.unsplash.com/photo-1616594039964-40891a909d99?auto=format&fit=crop&w=600&q=80",
    bathroom: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    kitchen: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=600&q=80",
    living: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=600&q=80",
    general: "https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&w=600&q=80"
};

// Placeholder videos (using Pexels)
const catVideos = {
    bedroom: "https://videos.pexels.com/video-files/6774656/6774656-uhd_2560_1440_25fps.mp4",
    bathroom: "https://videos.pexels.com/video-files/6774656/6774656-uhd_2560_1440_25fps.mp4", // Reuse for now
    kitchen: "https://videos.pexels.com/video-files/6774656/6774656-uhd_2560_1440_25fps.mp4", // Reuse for now
    living: "https://videos.pexels.com/video-files/6774656/6774656-uhd_2560_1440_25fps.mp4", // Reuse for now
    general: "https://videos.pexels.com/video-files/6774656/6774656-uhd_2560_1440_25fps.mp4"  // Reuse for now
};

export const HOUSEKEEPING_DATA: CategoryData[] = [
    {
        id: 'Bedroom',
        name: { en: 'Bedroom Amenities', ar: 'مستلزمات غرفة النوم' },
        image: catImages.bedroom,
        images: [catImages.bedroom],
        video: catVideos.bedroom,
        theme: { textColor: 'text-indigo-100', accentColor: 'bg-indigo-600' },
        items: [
            {
                id: 'bedsheet-single',
                name: { en: 'Single Bedsheet', ar: 'ملاءة سرير مفرد' },
                description: { en: 'Fresh cotton bedsheet for single bed', ar: 'ملاءة قطنية ناعمة لسرير مفرد' },
                category: 'Bedroom',
                image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'pillow-extra',
                name: { en: 'Extra Pillow', ar: 'وسادة إضافية' },
                description: { en: 'Soft hypoallergenic pillow', ar: 'وسادة ناعمة مضادة للحساسية' },
                category: 'Bedroom',
                image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'blanket-wool',
                name: { en: 'Wool Blanket', ar: 'بطانية صوف' },
                description: { en: 'Warm wool blanket for extra comfort', ar: 'بطانية صوف دافئة لمزيد من الراحة' },
                category: 'Bedroom',
                image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            }
        ]
    },
    {
        id: 'Bathroom',
        name: { en: 'Bathroom Amenities', ar: 'مستلزمات الحمام' },
        image: catImages.bathroom,
        images: [catImages.bathroom],
        video: catVideos.bathroom,
        theme: { textColor: 'text-cyan-100', accentColor: 'bg-cyan-600' },
        items: [
            {
                id: 'towel-set',
                name: { en: 'Towel Set', ar: 'طقم مناشف' },
                description: { en: 'Bath towel, hand towel, and face cloth', ar: 'منشفة استحمام، منشفة يد، ومنشفة وجه' },
                category: 'Bathroom',
                image: "https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'toiletries-kit',
                name: { en: 'Toiletries Kit', ar: 'طقم أدوات نظافة' },
                description: { en: 'Shampoo, conditioner, shower gel, and soap', ar: 'شامبو، بلسم، جل استحمام، وصابون' },
                category: 'Bathroom',
                image: "https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'bathrobe',
                name: { en: 'Bathrobe', ar: 'روب استحمام' },
                description: { en: 'Luxurious cotton bathrobe', ar: 'روب استحمام قطني فاخر' },
                category: 'Bathroom',
                image: "https://images.unsplash.com/photo-1583531172005-814191b8b6c0?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            }
        ]
    },
    {
        id: 'Kitchen',
        name: { en: 'Kitchen Items', ar: 'أدوات المطبخ' },
        image: catImages.kitchen,
        images: [catImages.kitchen],
        video: catVideos.kitchen,
        theme: { textColor: 'text-orange-100', accentColor: 'bg-orange-600' },
        items: [
            {
                id: 'cutlery-set',
                name: { en: 'Cutlery Set', ar: 'طقم أدوات مائدة' },
                description: { en: 'Forks, knives, and spoons for 2', ar: 'شوك، سكاكين، وملاعق لشخصين' },
                category: 'Kitchen',
                image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'crockery-plates',
                name: { en: 'Dinner Plates', ar: 'أطباق عشاء' },
                description: { en: 'Set of 2 ceramic dinner plates', ar: 'طقم من طبقين عشاء سيراميك' },
                category: 'Kitchen',
                image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            },
            {
                id: 'glassware-water',
                name: { en: 'Water Glasses', ar: 'أكواب ماء' },
                description: { en: 'Set of 2 crystal water glasses', ar: 'طقم من كوبين ماء كريستال' },
                category: 'Kitchen',
                image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
                isAvailable: true
            }
        ]
    }
];

export const UI_TEXT = {
    enterRoom: { en: "Enter Room Number", ar: "أدخل رقم الغرفة" },
    enterRoomPrompt: { en: "Please enter your room number to request items", ar: "الرجاء إدخال رقم الغرفة لطلب المستلزمات" },
    roomNumber: { en: "Room Number", ar: "رقم الغرفة" },
    requestItems: { en: "Request Items", ar: "طلب مستلزمات" },
    myRequest: { en: "My Request", ar: "طلبي" },
    items: { en: "items", ar: "عناصر" },
    confirmRequest: { en: "Confirm Request", ar: "تأكيد الطلب" },
    yourRequestEmpty: { en: "Your request list is empty", ar: "قائمة طلباتك فارغة" },
    requestReceived: { en: "Request Received!", ar: "تم استلام الطلب!" },
    requestMsg: { en: "Housekeeping will deliver your items shortly.", ar: "سيقوم فريق التدبير المنزلي بتوصيل طلباتك قريباً." },
    welcomeTitle: { en: "Seashell Housekeeping", ar: "خدمة التدبير المنزلي" },
    welcomeSubtitle: { en: "Everything you need for a comfortable stay.", ar: "كل ما تحتاجه لإقامة مريحة." }
};

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const dotenv = require('dotenv');

// Load environment variables from the Menu App's .env file
dotenv.config({ path: './Seashell-Menu-App/.env' });

// Firebase config
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: "seashell-meal-menu.firebaseapp.com",
    projectId: "seashell-meal-menu",
    storageBucket: "seashell-meal-menu.firebasestorage.app",
    messagingSenderId: "83327034076",
    appId: "1:83327034076:web:356447990aa5dd0cc10a19",
    measurementId: "G-KFRGD94EHC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Room Service Desserts Menu Items
const dessertsItems = [
    {
        name: {
            en: "Elba",
            ar: "إلبا"
        },
        description: {
            en: "Traditional creamy saffron custard",
            ar: "كاسترد الزعفران الكريمي التقليدي"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Croissant Pudding (Om Ali)",
            ar: "بودينغ الكرواسون (أم علي)"
        },
        description: {
            en: "Bread pudding made from butter croissants (45-minute order time)",
            ar: "بودينغ الخبز المصنوع من كرواسون الزبدة (وقت الطلب 45 دقيقة)"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer",
        tags: ["nuts"],
        note: "45-minute order time"
    },
    {
        name: {
            en: "Biscuit Trifle",
            ar: "ترايفل البسكويت"
        },
        description: {
            en: "Layers of whipped cream and biscuit topped with caramelized pecan (45-minute order time)",
            ar: "طبقات من الكريمة المخفوقة والبسكويت مغطاة بالبيكان المكرمل (وقت الطلب 45 دقيقة)"
        },
        price: 2.500,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer",
        note: "45-minute order time"
    },
    {
        name: {
            en: "Date Bar",
            ar: "بار التمر"
        },
        description: {
            en: "Date bar infused with nuts and spices",
            ar: "بار التمر المنقوع بالمكسرات والتوابل"
        },
        price: 2.500,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer",
        tags: ["nuts"]
    },
    {
        name: {
            en: "Banana Split",
            ar: "بانانا سبليت"
        },
        description: {
            en: "Sliced banana with 3 scoops of ice cream",
            ar: "موز مقطع مع 3 كرات من الآيس كريم"
        },
        price: 2.750,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Oasis Trio",
            ar: "أواسيس تريو"
        },
        description: {
            en: "3 scoops of Italian ice cream",
            ar: "3 كرات من الآيس كريم الإيطالي"
        },
        price: 2.000,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Baked Cheesecake",
            ar: "تشيز كيك مخبوز"
        },
        description: {
            en: "Classic baked cheesecake",
            ar: "تشيز كيك مخبوز كلاسيكي"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Warm Walnut Brownie",
            ar: "براوني الجوز الدافئ"
        },
        description: {
            en: "Warm brownie with walnuts",
            ar: "براوني دافئ مع الجوز"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer",
        tags: ["nuts"]
    },
    {
        name: {
            en: "Chocolate Fudge",
            ar: "فدج الشوكولاتة"
        },
        description: {
            en: "Served with vanilla ice cream",
            ar: "يقدم مع آيس كريم الفانيليا"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Fruit Salad",
            ar: "سلطة فواكه"
        },
        description: {
            en: "Served with vanilla ice cream",
            ar: "تقدم مع آيس كريم الفانيليا"
        },
        price: 1.500,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Cappuccino Tiramisu",
            ar: "تيراميسو كابتشينو"
        },
        description: {
            en: "Made with Italian mascarpone cheese",
            ar: "مصنوع من جبن الماسكاربوني الإيطالي"
        },
        price: 2.250,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Chocolate Brownies",
            ar: "براونيز الشوكولاتة"
        },
        description: {
            en: "Warm brownies with a scoop of ice cream",
            ar: "براونيز دافئ مع كرة من الآيس كريم"
        },
        price: 2.500,
        category: "Desserts",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/desserts.jpg",
        season: "Summer",
        tags: ["nuts"]
    }
];

async function seedDessertsMenu() {
    console.log('🍰 Starting Room Service Desserts Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of dessertsItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            const note = item.note ? ` (${item.note})` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags}${note} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} dessert items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 12 Sweet Desserts');
        console.log('- Tags: Nuts (4)');
        console.log('- Special: 2 items require 45-minute preparation time');
        console.log('- Price range: KD 1.500 - 2.750');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding desserts menu:', error);
    }
}

// Run the seeding
seedDessertsMenu();

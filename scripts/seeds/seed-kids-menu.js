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

// Room Service Kid's Meals Menu Items
const kidsMealsItems = [
    {
        name: {
            en: "Sliders",
            ar: "سلايدرز"
        },
        description: {
            en: "2 mini burgers (chicken or beef) with tomato, cheese and coleslaw salad",
            ar: "2 برجر صغير (دجاج أو لحم بقري) مع طماطم وجبن وسلطة الكول سلو"
        },
        price: 2.500,
        category: "Kids",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/kids.jpg",
        season: "Summer",
        note: "Served with French fries and ketchup"
    },
    {
        name: {
            en: "Chicken Nuggets",
            ar: "ناجتس دجاج"
        },
        description: {
            en: "5 pieces with ketchup",
            ar: "5 قطع مع كاتشب"
        },
        price: 2.000,
        category: "Kids",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/kids.jpg",
        season: "Summer",
        note: "Served with French fries and ketchup"
    },
    {
        name: {
            en: "Hotdogs",
            ar: "هوت دوج"
        },
        description: {
            en: "2 hot dogs in a bun with mayo, mustard and ketchup",
            ar: "2 هوت دوج في خبز مع مايونيز وخردل وكاتشب"
        },
        price: 2.000,
        category: "Kids",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/kids.jpg",
        season: "Summer",
        note: "Served with French fries and ketchup"
    },
    {
        name: {
            en: "Chicken Lollipops",
            ar: "دجاج لوليبوب"
        },
        description: {
            en: "5 pieces of chicken wings",
            ar: "5 قطع من أجنحة الدجاج"
        },
        price: 1.750,
        category: "Kids",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/kids.jpg",
        season: "Summer",
        note: "Served with French fries and ketchup"
    },
    {
        name: {
            en: "Fish Fingers",
            ar: "أصابع السمك"
        },
        description: {
            en: "5 pieces of crispy fish fingers with tartar sauce",
            ar: "5 قطع من أصابع السمك المقرمشة مع صلصة التارتار"
        },
        price: 3.000,
        category: "Kids",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/kids.jpg",
        season: "Summer",
        note: "Served with French fries and ketchup"
    }
];

async function seedKidsMealsMenu() {
    console.log('👶 Starting Room Service Kid\'s Meals Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of kidsMealsItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} kid's meal items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 5 Kid-Friendly Meals');
        console.log('- All served with French fries and ketchup');
        console.log('- Price range: KD 1.750 - 3.000');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding kid\'s meals menu:', error);
    }
}

// Run the seeding
seedKidsMealsMenu();

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

// Room Service Smoothies Menu Items
const smoothiesItems = [
    {
        name: {
            en: "Passion Fruit Smoothie",
            ar: "سموذي فاكهة الباشن"
        },
        description: {
            en: "Creamy passion fruit smoothie",
            ar: "سموذي فاكهة الباشن الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Peach Smoothie",
            ar: "سموذي الخوخ"
        },
        description: {
            en: "Creamy peach smoothie",
            ar: "سموذي الخوخ الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mango Smoothie",
            ar: "سموذي المانجو"
        },
        description: {
            en: "Creamy mango smoothie",
            ar: "سموذي المانجو الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Red Berries Smoothie",
            ar: "سموذي التوت الأحمر"
        },
        description: {
            en: "Creamy red berries smoothie",
            ar: "سموذي التوت الأحمر الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Raspberry Smoothie",
            ar: "سموذي التوت البري"
        },
        description: {
            en: "Creamy raspberry smoothie",
            ar: "سموذي التوت البري الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Strawberry Smoothie",
            ar: "سموذي الفراولة"
        },
        description: {
            en: "Creamy strawberry smoothie",
            ar: "سموذي الفراولة الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Coconut Smoothie",
            ar: "سموذي جوز الهند"
        },
        description: {
            en: "Creamy coconut smoothie",
            ar: "سموذي جوز الهند الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Banana Smoothie",
            ar: "سموذي الموز"
        },
        description: {
            en: "Creamy banana smoothie",
            ar: "سموذي الموز الكريمي"
        },
        price: 2.000,
        category: "Smoothies",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    }
];

async function seedSmoothiesMenu() {
    console.log('🥤 Starting Room Service Smoothies Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of smoothiesItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} smoothie items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 8 Creamy Smoothies');
        console.log('- Flavors: Passion Fruit, Peach, Mango, Red Berries, Raspberry, Strawberry, Coconut, Banana');
        console.log('- Price: KD 2.000 each');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding smoothies menu:', error);
    }
}

// Run the seeding
seedSmoothiesMenu();

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

// Room Service Burgers Menu Items
const burgersItems = [
    {
        name: {
            en: "Seashell Cheeseburger",
            ar: "تشيز برجر سيشل"
        },
        description: {
            en: "In-house beef patty, lettuce, cheddar, grilled tomato with a side of coleslaw",
            ar: "فطيرة لحم بقري محلية، خس، شيدر، طماطم مشوية مع سلطة الكول سلو"
        },
        price: 4.000,
        category: "Burgers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with French fries"
    },
    {
        name: {
            en: "Mushroom Sliders",
            ar: "سلايدرز الفطر"
        },
        description: {
            en: "Beef patty with creamy mushrooms, caramelized onion and cheese",
            ar: "فطيرة لحم بقري مع فطر كريمي، بصل مكرمل وجبن"
        },
        price: 3.000,
        category: "Burgers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with French fries"
    },
    {
        name: {
            en: "Brioche Beef Burger",
            ar: "برجر لحم بريوش"
        },
        description: {
            en: "Caramelized onion in date syrup with lemon labneh mayo",
            ar: "بصل مكرمل في دبس التمر مع مايونيز اللبنة بالليمون"
        },
        price: 4.500,
        category: "Burgers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with French fries"
    },
    {
        name: {
            en: "Crispy Chicken Burger",
            ar: "برجر دجاج مقرمش"
        },
        description: {
            en: "Crispy fried chicken, mayo, cheddar, lettuce and tomato with a side of coleslaw",
            ar: "دجاج مقلي مقرمش، مايونيز، شيدر، خس وطماطم مع سلطة الكول سلو"
        },
        price: 3.500,
        category: "Burgers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with French fries"
    }
];

async function seedBurgersMenu() {
    console.log('🍔 Starting Room Service Burgers Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of burgersItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} burger items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 4 Gourmet Burgers');
        console.log('- All served with French fries');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding burgers menu:', error);
    }
}

// Run the seeding
seedBurgersMenu();

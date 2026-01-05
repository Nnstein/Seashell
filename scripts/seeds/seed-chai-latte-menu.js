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

// Room Service Special Chai Latte Drinks Menu Items
const chaiLatteItems = [
    {
        name: {
            en: "Cold Vanilla Chai Latte",
            ar: "فانيليا شاي لاتيه بارد"
        },
        description: {
            en: "Creamy iced chai latte with a touch of vanilla",
            ar: "شاي لاتيه مثلج كريمي مع لمسة من الفانيليا"
        },
        price: 2.250,
        category: "Chai Latte",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Vegan Iced Chai Latte",
            ar: "شاي لاتيه مثلج نباتي"
        },
        description: {
            en: "Plant-based iced chai latte made with dairy-free alternatives",
            ar: "شاي لاتيه مثلج نباتي مصنوع من بدائل خالية من الألبان"
        },
        price: 2.250,
        category: "Chai Latte",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    }
];

async function seedChaiLatteMenu() {
    console.log('🍵 Starting Room Service Special Chai Latte Drinks Seeding...\n');

    try {
        let count = 0;
        for (const item of chaiLatteItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} Chai Latte items to Room Service menu!`);
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding Chai Latte menu:', error);
    }
}

// Run the seeding
seedChaiLatteMenu();

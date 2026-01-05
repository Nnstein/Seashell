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

// Room Service Milkshakes Menu Items
const milkshakesItems = [
    {
        name: {
            en: "Vanilla Milkshake",
            ar: "ميلك شيك الفانيليا"
        },
        description: {
            en: "Classic vanilla milkshake",
            ar: "ميلك شيك الفانيليا الكلاسيكي"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Banana Milkshake",
            ar: "ميلك شيك الموز"
        },
        description: {
            en: "Creamy banana milkshake",
            ar: "ميلك شيك الموز الكريمي"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Chocolate Milkshake",
            ar: "ميلك شيك الشوكولاتة"
        },
        description: {
            en: "Rich chocolate milkshake",
            ar: "ميلك شيك الشوكولاتة الغني"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Oreo Vanilla Milkshake",
            ar: "ميلك شيك أوريو فانيليا"
        },
        description: {
            en: "Vanilla milkshake blended with Oreo cookies",
            ar: "ميلك شيك الفانيليا الممزوج مع بسكويت أوريو"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Strawberry Milkshake",
            ar: "ميلك شيك الفراولة"
        },
        description: {
            en: "Fresh strawberry milkshake",
            ar: "ميلك شيك الفراولة الطازج"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Oreo Chocolate Blended Milkshake",
            ar: "ميلك شيك أوريو شوكولاتة ممزوج"
        },
        description: {
            en: "Chocolate milkshake blended with Oreo cookies",
            ar: "ميلك شيك الشوكولاتة الممزوج مع بسكويت أوريو"
        },
        price: 2.000,
        category: "Milkshakes",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    }
];

async function seedMilkshakesMenu() {
    console.log('🥛 Starting Room Service Milkshakes Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of milkshakesItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} milkshake items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 6 Classic Milkshakes');
        console.log('- Flavors: Vanilla, Banana, Chocolate, Oreo Vanilla, Strawberry, Oreo Chocolate Blended');
        console.log('- Price: KD 2.000 each');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding milkshakes menu:', error);
    }
}

// Run the seeding
seedMilkshakesMenu();

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

// Room Service Beverages Menu Items
const beveragesItems = [
    {
        name: {
            en: "Fresh Orange Juice",
            ar: "عصير برتقال طازج"
        },
        description: {
            en: "Freshly squeezed orange juice",
            ar: "عصير برتقال طازج معصور"
        },
        price: 1.750,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Lemon n' Mint",
            ar: "ليمون ونعناع"
        },
        description: {
            en: "Refreshing lemon and mint drink",
            ar: "مشروب الليمون والنعناع المنعش"
        },
        price: 1.750,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    // Seasonal Juices
    {
        name: {
            en: "Watermelon Juice",
            ar: "عصير البطيخ"
        },
        description: {
            en: "Fresh watermelon juice",
            ar: "عصير بطيخ طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Pineapple Juice",
            ar: "عصير الأناناس"
        },
        description: {
            en: "Fresh pineapple juice",
            ar: "عصير أناناس طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Sweet Melon Juice",
            ar: "عصير الشمام"
        },
        description: {
            en: "Fresh sweet melon juice",
            ar: "عصير شمام طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Kiwi Juice",
            ar: "عصير الكيوي"
        },
        description: {
            en: "Fresh kiwi juice",
            ar: "عصير كيوي طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Banana Juice",
            ar: "عصير الموز"
        },
        description: {
            en: "Fresh banana juice",
            ar: "عصير موز طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Strawberry Juice",
            ar: "عصير الفراولة"
        },
        description: {
            en: "Fresh strawberry juice",
            ar: "عصير فراولة طازج"
        },
        price: 2.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    }
];

async function seedBeveragesMenu() {
    console.log('🥤 Starting Room Service Beverages Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of beveragesItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} beverage items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 2 Fresh Juices (Orange, Lemon n\' Mint)');
        console.log('- 6 Seasonal Juices (Watermelon, Pineapple, Sweet Melon, Kiwi, Banana, Strawberry)');
        console.log('- All freshly prepared');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding beverages menu:', error);
    }
}

// Run the seeding
seedBeveragesMenu();

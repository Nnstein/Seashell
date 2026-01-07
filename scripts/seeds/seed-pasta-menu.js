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

// Room Service Pasta Menu Items
const pastaItems = [
    {
        name: {
            en: "Fusilli Arrabiata",
            ar: "فوسيلي أرابياتا"
        },
        description: {
            en: "Tomato sauce with garlic and chili flakes stirred into fusilli, sprinkled with parsley",
            ar: "صلصة طماطم مع ثوم ورقائق الفلفل الحار مع فوسيلي، مرشوش بالبقدونس"
        },
        price: 3.500,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        tags: ["spicy"],
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Spaghetti Bolognese",
            ar: "سباغيتي بولونيز"
        },
        description: {
            en: "Minced beef and herbs in tomato sauce with spaghetti",
            ar: "لحم بقري مفروم وأعشاب في صلصة الطماطم مع سباغيتي"
        },
        price: 4.000,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Tagliatelle Alfredo",
            ar: "تالياتيلي ألفريدو"
        },
        description: {
            en: "Sautéed mushrooms and garlic in a creamy sauce over tagliatelle",
            ar: "فطر وثوم مقلي في صلصة كريمية فوق تالياتيلي"
        },
        price: 3.500,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Penne Pesto",
            ar: "بيني بيستو"
        },
        description: {
            en: "Basil blended with parmesan and garlic mixed with penne pasta",
            ar: "ريحان ممزوج مع جبن البارميزان والثوم مع معكرونة بيني"
        },
        price: 3.500,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        tags: ["nuts"],
        note: "Nuts may be present",
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Spaghetti Meatballs",
            ar: "سباغيتي بكرات اللحم"
        },
        description: {
            en: "Classic spaghetti with savory meatballs in tomato sauce",
            ar: "سباغيتي كلاسيكي مع كرات اللحم اللذيذة في صلصة الطماطم"
        },
        price: 4.250,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Pink Penne",
            ar: "بيني وردي"
        },
        description: {
            en: "Tomato and cream sauce with mushrooms, penne and parmesan",
            ar: "صلصة الطماطم والكريمة مع الفطر والبيني والبارميزان"
        },
        price: 3.500,
        category: "Pasta",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pasta.jpg",
        season: "Summer",
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    }
];

async function seedPastaMenu() {
    console.log('🍝 Starting Room Service Pasta Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of pastaItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            const addons = item.addons ? ` (${item.addons.length} add-ons)` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags}${addons} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} pasta items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 6 Pasta Dishes');
        console.log('- All with optional add-ons: Grilled Chicken (+0.750 KD), Shrimps (+1.000 KD)');
        console.log('- Tags: Spicy (1), Nuts (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding pasta menu:', error);
    }
}

// Run the seeding
seedPastaMenu();

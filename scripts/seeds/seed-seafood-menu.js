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

// Room Service From the Sea Menu Items
const seafoodItems = [
    {
        name: {
            en: "Seashell Basket",
            ar: "سلة سيشل"
        },
        description: {
            en: "Fried shrimps, crispy breaded fish, calamari served with tartar sauce and fries",
            ar: "جمبري مقلي، سمك مقرمش مغطى بالبقسماط، كاليماري يقدم مع صلصة التارتار والبطاطس المقلية"
        },
        price: 4.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Crispy Shrimps",
            ar: "جمبري مقرمش"
        },
        description: {
            en: "Golden fried shrimps with tartar sauce and fries",
            ar: "جمبري مقلي ذهبي مع صلصة التارتار والبطاطس المقلية"
        },
        price: 5.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Grilled Hammour",
            ar: "هامور مشوي"
        },
        description: {
            en: "Fresh hammour fillet marinated in garlic served with white rice, steamed vegetables and lemon butter sauce",
            ar: "فيليه هامور طازج متبل بالثوم يقدم مع أرز أبيض، خضار مطهوة على البخار وصلصة الزبدة بالليمون"
        },
        price: 5.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Crispy Calamari",
            ar: "كاليماري مقرمش"
        },
        description: {
            en: "Fried calamari with tartar sauce and fries",
            ar: "كاليماري مقلي مع صلصة التارتار والبطاطس المقلية"
        },
        price: 3.750,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Sea Bass",
            ar: "سي باس"
        },
        description: {
            en: "Steamed sea bass over sautéed spinach with creole sauce",
            ar: "سي باس مطهو على البخار فوق سبانخ مقلية مع صلصة كريول"
        },
        price: 6.750,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Fish and Chips",
            ar: "فيش آند تشيبس"
        },
        description: {
            en: "Crispy breaded fish fillet served with French fries",
            ar: "فيليه سمك مقرمش مغطى بالبقسماط يقدم مع البطاطس المقلية"
        },
        price: 4.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Atlantic Salmon",
            ar: "سلمون أتلانتيك"
        },
        description: {
            en: "Served with white rice or mashed potato and saffron sauce",
            ar: "يقدم مع أرز أبيض أو بطاطس مهروسة وصلصة الزعفران"
        },
        price: 7.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Hammour Moutabak",
            ar: "هامور مطبق"
        },
        description: {
            en: "Local hammour fillet cooked with tomato, cardamom and ginger over saffron rice with dakkous sauce",
            ar: "فيليه هامور محلي مطبوخ مع طماطم وهيل وزنجبيل فوق أرز بالزعفران مع صلصة الدقوس"
        },
        price: 6.000,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer",
        tags: ["traditional"]
    },
    {
        name: {
            en: "Shanghai Shrimps",
            ar: "جمبري شنغهاي"
        },
        description: {
            en: "Shrimps marinated with Shanghai spices served with steamed rice",
            ar: "جمبري متبل ببهارات شنغهاي يقدم مع أرز مطهو على البخار"
        },
        price: 6.750,
        category: "Seafood",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/seafood.jpg",
        season: "Summer"
    }
];

async function seedSeafoodMenu() {
    console.log('🐟 Starting Room Service From the Sea Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of seafoodItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} seafood items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 9 Fresh Seafood Dishes');
        console.log('- Tags: Traditional (1)');
        console.log('- Price range: KD 3.750 - 7.000');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding seafood menu:', error);
    }
}

// Run the seeding
seedSeafoodMenu();

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

// Room Service Starters Menu Items
const startersItems = [
    {
        name: {
            en: "Lentil Soup",
            ar: "شوربة العدس"
        },
        description: {
            en: "Creamy lentil soup with light spices",
            ar: "شوربة عدس كريمية مع بهارات خفيفة"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer",
        tags: ["spicy"]
    },
    {
        name: {
            en: "Creamy Mushroom Soup",
            ar: "شوربة الفطر الكريمية"
        },
        description: {
            en: "Rich and creamy mushroom soup",
            ar: "شوربة فطر غنية وكريمية"
        },
        price: 1.750,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/soups.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Soup of the Day",
            ar: "شوربة اليوم"
        },
        description: {
            en: "Made daily by the Head Chef",
            ar: "يتم تحضيرها يومياً من قبل الشيف الرئيسي"
        },
        price: 1.750,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/soups.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mozzarella Sticks",
            ar: "أصابع الموزاريلا"
        },
        description: {
            en: "Mozzarella sticks with crispy herb breading and marinara sauce",
            ar: "أصابع موزاريلا مع طبقة أعشاب مقرمشة وصلصة مارينارا"
        },
        price: 2.000,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Cheesy Garlic Bread",
            ar: "خبز الثوم بالجبن"
        },
        description: {
            en: "Freshly baked baguette with garlic butter, oregano and melted cheese",
            ar: "باجيت طازج مع زبدة الثوم والأوريجانو والجبن المذاب"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Buffalo Wings",
            ar: "أجنحة الدجاج الحارة"
        },
        description: {
            en: "Deep fried chicken wings tossed in a mildly spicy sauce",
            ar: "أجنحة دجاج مقلية مغطاة بصلصة حارة معتدلة"
        },
        price: 2.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer",
        tags: ["spicy"]
    },
    {
        name: {
            en: "Dynamite Fries",
            ar: "بطاطس ديناميت"
        },
        description: {
            en: "Potato cut fries topped with melted cheese and crispy beef bacon",
            ar: "بطاطس مقطعة مغطاة بالجبن المذاب ولحم البقر المقدد المقرمش"
        },
        price: 2.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Loaded Nachos",
            ar: "ناتشوز محملة"
        },
        description: {
            en: "Crispy nachos topped with beef chili, cheese, tomato, olives, guacamole and sour cream",
            ar: "ناتشوز مقرمشة مغطاة بلحم البقر الحار والجبن والطماطم والزيتون والجواكامولي والكريمة الحامضة"
        },
        price: 3.000,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mixed Arabic Bites",
            ar: "مقبلات عربية مشكلة"
        },
        description: {
            en: "Mini kibbeh, spring rolls, cheese rolls",
            ar: "كبة صغيرة، سبرينج رول، لفائف الجبن"
        },
        price: 3.000,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer",
        tags: ["traditional", "spicy"]
    },
    {
        name: {
            en: "Fried Halloumi",
            ar: "حلوم مقلي"
        },
        description: {
            en: "Bite-size pieces of crispy halloumi",
            ar: "قطع صغيرة من الحلوم المقرمش"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mac & Cheese Balls",
            ar: "كرات المعكرونة والجبن"
        },
        description: {
            en: "Breaded and fried until crispy",
            ar: "مغطاة بالبقسماط ومقلية حتى تصبح مقرمشة"
        },
        price: 2.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mezze",
            ar: "مزة"
        },
        description: {
            en: "Hummus, fattoush, tabouleh, labneh, pickles, moutabal, vine leaves, garlic labneh, kibbeh, spinach fatayer",
            ar: "حمص، فتوش، تبولة، لبنة، مخللات، متبل، ورق عنب، لبنة بالثوم، كبة، فطائر السبانخ"
        },
        price: 5.000,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer",
        tags: ["vegetarian", "traditional", "nuts"],
        note: "Nuts may be present"
    },
    {
        name: {
            en: "Onion Rings",
            ar: "حلقات البصل"
        },
        description: {
            en: "Crispy golden onion rings",
            ar: "حلقات بصل ذهبية مقرمشة"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Potato Wedges",
            ar: "أسافين البطاطس"
        },
        description: {
            en: "Seasoned potato wedges",
            ar: "أسافين بطاطس متبلة"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Spicy Curly Fries",
            ar: "بطاطس مجعدة حارة"
        },
        description: {
            en: "Crispy curly fries with spicy seasoning",
            ar: "بطاطس مجعدة مقرمشة مع توابل حارة"
        },
        price: 1.500,
        category: "Appetizers",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/appetizers.jpg",
        season: "Summer",
        tags: ["spicy"]
    }
];

async function seedStartersMenu() {
    console.log('🍟 Starting Room Service Starters Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of startersItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} starters items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 3 Soups (1 spicy)');
        console.log('- 12 Appetizers/Sides');
        console.log('- Tags: Spicy (4), Traditional (2), Vegetarian (1), Nuts (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding starters menu:', error);
    }
}

// Run the seeding
seedStartersMenu();

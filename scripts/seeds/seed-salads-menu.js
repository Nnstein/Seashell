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

// Room Service Salads Menu Items
const saladsItems = [
    {
        name: {
            en: "Greek Salad",
            ar: "سلطة يونانية"
        },
        description: {
            en: "Lettuce, capsicum, cucumber, black olives, feta, oregano, lemon-oil",
            ar: "خس، فلفل رومي، خيار، زيتون أسود، جبنة فيتا، أوريجانو، زيت الليمون"
        },
        price: 2.750,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer",
        tags: ["vegetarian"]
    },
    {
        name: {
            en: "Caesar Salad",
            ar: "سلطة سيزر"
        },
        description: {
            en: "Crispy romaine, croutons, parmesan, Caesar dressing",
            ar: "خس روماني مقرمش، خبز محمص، جبن بارميزان، صلصة سيزر"
        },
        price: 2.500,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer",
        // Add-ons for Caesar Salad
        addons: [
            { name: "Grilled Chicken", price: 0.750 },
            { name: "Shrimps", price: 1.000 }
        ]
    },
    {
        name: {
            en: "Squash Mabooch",
            ar: "قرع مبوش"
        },
        description: {
            en: "Roasted pumpkin, grilled corn, red mabooch, tossed with garlic vinaigrette",
            ar: "يقطين محمص، ذرة مشوية، مبوش أحمر، مع صلصة الثوم"
        },
        price: 3.500,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer",
        tags: ["vegetarian", "traditional"]
    },
    {
        name: {
            en: "Shrimp Cocktail",
            ar: "كوكتيل الجمبري"
        },
        description: {
            en: "Freshly cooked shrimps with Thousand Island dressing and crispy breadsticks",
            ar: "جمبري طازج مطبوخ مع صلصة ثاوزند آيلاند وأعواد خبز مقرمشة"
        },
        price: 4.000,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Crispy Garden Salad",
            ar: "سلطة الحديقة المقرمشة"
        },
        description: {
            en: "Mixed lettuce, carrots, cucumber, capsicum, lemon vinaigrette",
            ar: "خس مشكل، جزر، خيار، فلفل رومي، صلصة الليمون"
        },
        price: 3.000,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Watermelon Salad",
            ar: "سلطة البطيخ"
        },
        description: {
            en: "Fresh watermelon with feta, mint and basil",
            ar: "بطيخ طازج مع جبنة فيتا والنعناع والريحان"
        },
        price: 3.000,
        category: "Salads",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/salads.jpg",
        season: "Summer"
    }
];

async function seedSaladsMenu() {
    console.log('🥗 Starting Room Service Salads Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of saladsItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            const addons = item.addons ? ` (${item.addons.length} add-ons)` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags}${addons} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} salad items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 6 Fresh Salads');
        console.log('- Caesar Salad: Optional add-ons (Grilled Chicken +0.750 KD, Shrimps +1.000 KD)');
        console.log('- Tags: Vegetarian (3), Traditional (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding salads menu:', error);
    }
}

// Run the seeding
seedSaladsMenu();

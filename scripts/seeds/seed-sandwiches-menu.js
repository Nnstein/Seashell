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

// Room Service Sandwiches Menu Items
const sandwichesItems = [
    {
        name: {
            en: "Triple Decker Club",
            ar: "ساندويتش كلوب ثلاثي الطبقات"
        },
        description: {
            en: "Grilled chicken, mayo, fried egg, lettuce, tomato, cheese, pickles in toasted white bread",
            ar: "دجاج مشوي، مايونيز، بيض مقلي، خس، طماطم، جبن، مخللات في خبز أبيض محمص"
        },
        price: 3.500,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Philly Cheese Steak",
            ar: "ساندويتش فيلي تشيز ستيك"
        },
        description: {
            en: "Marinated steak strips, creamy cheese, lettuce, sautéed mushrooms in French baguette",
            ar: "شرائح لحم متبلة، جبن كريمي، خس، فطر مقلي في باجيت فرنسي"
        },
        price: 3.500,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Meatball Sub",
            ar: "ساندويتش كرات اللحم"
        },
        description: {
            en: "Baguette stuffed with meatballs, tomato sauce and cheese",
            ar: "باجيت محشو بكرات اللحم وصلصة الطماطم والجبن"
        },
        price: 4.000,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Chicken Shish Tawouk",
            ar: "شيش طاووق"
        },
        description: {
            en: "Marinated grilled chicken with pickles, lettuce and garlic sauce wrapped in fresh saj bread",
            ar: "دجاج مشوي متبل مع مخللات وخس وصلصة الثوم ملفوف في خبز صاج طازج"
        },
        price: 3.500,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Chicken Shawarma",
            ar: "شاورما دجاج"
        },
        description: {
            en: "Tender spiced chicken slices in Arabic bread with pickles, garlic mayo and tahina",
            ar: "شرائح دجاج متبلة طرية في خبز عربي مع مخللات ومايونيز الثوم والطحينة"
        },
        price: 3.500,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        tags: ["spicy"],
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Chicken Fillet",
            ar: "فيليه دجاج"
        },
        description: {
            en: "Grilled chicken, mayo, lettuce, tomato, cheese and pickles served in thick cut ciabatta",
            ar: "دجاج مشوي، مايونيز، خس، طماطم، جبن ومخللات في خبز تشياباتا سميك"
        },
        price: 3.000,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Chicken Panini",
            ar: "بانيني دجاج"
        },
        description: {
            en: "Breaded chicken with honey-mustard sauce, iceberg lettuce, tomato, cheese and pickles",
            ar: "دجاج مغطى بالبقسماط مع صلصة العسل والخردل، خس آيسبرج، طماطم، جبن ومخللات"
        },
        price: 3.000,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Mexican Fajita",
            ar: "فاهيتا مكسيكية"
        },
        description: {
            en: "Marinated chicken wrapped in tortilla with capsicum, lettuce, cheese and jalapeños",
            ar: "دجاج متبل ملفوف في تورتيلا مع فلفل رومي وخس وجبن وهالبينو"
        },
        price: 3.500,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        note: "Served with chunky fries"
    },
    {
        name: {
            en: "Smoked Salmon Toast",
            ar: "توست السلمون المدخن"
        },
        description: {
            en: "Smoked salmon with sour cream, rocca, white onion and capers on toast",
            ar: "سلمون مدخن مع كريمة حامضة، جرجير، بصل أبيض وكبر على توست"
        },
        price: 4.000,
        category: "Sandwiches",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        tags: ["nuts"],
        note: "Nuts may be present. Served with chunky fries"
    }
];

async function seedSandwichesMenu() {
    console.log('🥪 Starting Room Service Sandwiches Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of sandwichesItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} sandwich items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 9 Sandwiches & Wraps');
        console.log('- All served with chunky fries');
        console.log('- Tags: Spicy (1), Nuts (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding sandwiches menu:', error);
    }
}

// Run the seeding
seedSandwichesMenu();

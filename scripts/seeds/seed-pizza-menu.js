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

// Room Service Pizza Menu Items
const pizzaItems = [
    {
        name: {
            en: "Margherita Pizza",
            ar: "بيتزا مارغريتا"
        },
        description: {
            en: "Tomato sauce, mozzarella and basil",
            ar: "صلصة طماطم، موزاريلا وريحان"
        },
        price: 3.250,
        category: "Pizza",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pizza.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Quattro Stagioni",
            ar: "كواترو ستاجيوني"
        },
        description: {
            en: "Mozzarella, mushrooms, artichoke hearts and smoked turkey",
            ar: "موزاريلا، فطر، قلوب الخرشوف والديك الرومي المدخن"
        },
        price: 4.000,
        category: "Pizza",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pizza.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Vegetarian Pizza",
            ar: "بيتزا نباتية"
        },
        description: {
            en: "Tomato sauce, mozzarella, capsicum, zucchini, eggplant and tomatoes",
            ar: "صلصة طماطم، موزاريلا، فلفل رومي، كوسة، باذنجان وطماطم"
        },
        price: 3.500,
        category: "Pizza",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pizza.jpg",
        season: "Summer",
        tags: ["vegetarian"]
    },
    {
        name: {
            en: "Pepperoni Pizza",
            ar: "بيتزا بيبروني"
        },
        description: {
            en: "Tomato sauce, mozzarella and pepperoni",
            ar: "صلصة طماطم، موزاريلا وبيبروني"
        },
        price: 4.000,
        category: "Pizza",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pizza.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "BBQ Chicken Pizza",
            ar: "بيتزا دجاج باربيكيو"
        },
        description: {
            en: "Shredded chicken breast tossed in BBQ sauce",
            ar: "صدر دجاج مقطع مع صلصة الباربيكيو"
        },
        price: 4.000,
        category: "Pizza",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/pizza.jpg",
        season: "Summer"
    }
];

async function seedPizzaMenu() {
    console.log('🍕 Starting Room Service Pizza Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of pizzaItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} pizza items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 5 Pizza Varieties');
        console.log('- Tags: Vegetarian (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding pizza menu:', error);
    }
}

// Run the seeding
seedPizzaMenu();

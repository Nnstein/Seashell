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

// Shared Syrup Addons (0.250 KD each)
const syrupAddons = [
    { name: "Mango Syrup", price: 0.250 },
    { name: "Peach Syrup", price: 0.250 },
    { name: "Passion Fruit Syrup", price: 0.250 },
    { name: "Banana Syrup", price: 0.250 },
    { name: "Coconut Syrup", price: 0.250 },
    { name: "Strawberry Syrup", price: 0.250 },
    { name: "Raspberry Syrup", price: 0.250 }
];

// Room Service Mocktails Menu Items
const mocktailsItems = [
    {
        name: { en: "Cucumber Mojito", ar: "موخيتو الخيار" },
        description: { en: "Refreshing cucumber and mint mojito", ar: "موخيتو الخيار والنعناع المنعش" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Fruit Cocktail", ar: "كوكتيل الفواكه" },
        description: { en: "Freshly blended mixed fruit cocktail", ar: "كوكتيل فواكه مشكلة طازجة" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Bluetooth", ar: "بلوتوث" },
        description: { en: "Signature blue mocktail with citrus notes", ar: "موكتيل أزرق مميز بنكهة الحمضيات" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Home made Ice Tea", ar: "شاي مثلج منزلي" },
        description: { en: "Refreshing house-brewed ice tea", ar: "شاي مثلج منعش مُحضر منزلياً" },
        price: 1.750,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Strawberry Margarita", ar: "مارغريتا الفراولة" },
        description: { en: "Virgin strawberry margarita with a salt/sugar rim", ar: "مارغريتا الفراولة المنعشة" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Virgin Mint Lemonade", ar: "ليمونادة بالنعناع" },
        description: { en: "Classically blended mint and lemon juice", ar: "عصير الليمون والنعناع الكلاسيكي" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Virgin Colada", ar: "فيرجن كولادا" },
        description: { en: "Creamy pineapple and coconut blend", ar: "مزيج الأناناس وجوز الهند الكريمي" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    },
    {
        name: { en: "Vanilla Lemonade", ar: "ليمونادة بالفانيليا" },
        description: { en: "Refreshing lemonade with a hint of vanilla", ar: "ليمونادة منعشة مع لمسة من الفانيليا" },
        price: 2.250,
        category: "Mocktails",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: "Syrups: Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry"
    }
];

async function seedMocktailsMenu() {
    console.log('🍹 Starting Room Service Mocktails Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of mocktailsItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) + ${item.addons.length} Syrups - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} mocktail items to Room Service menu!`);
        console.log('\n✨ All items include the syrup addon option (+0.250 KD)');

    } catch (error) {
        console.error('❌ Error seeding mocktails menu:', error);
    }
}

// Run the seeding
seedMocktailsMenu();

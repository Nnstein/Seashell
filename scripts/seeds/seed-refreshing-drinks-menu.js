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

const beverageSyrupsList = "Mango; Peach; Passion Fruit; Banana; Coconut; Strawberry; Raspberry";

// Room Service Refreshing Drinks Menu Items
const refreshingDrinksItems = [
    {
        name: { en: "Rim Water 1.5L", ar: "مياه ريم 1.5 لتر" },
        description: { en: "Large bottled mineral water", ar: "مياه معدنية معبأة كبيرة" },
        price: 1.250,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Rim Water 500ml", ar: "مياه ريم 500 مل" },
        description: { en: "Small bottled mineral water", ar: "مياه معدنية معبأة صغيرة" },
        price: 0.500,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Soft Drinks 250ml", ar: "مشروبات غازية 250 مل" },
        description: { en: "Choice of chilled soft drinks", ar: "اختيارك من المشروبات الغازية الباردة" },
        price: 0.500,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: `Available Syrups: ${beverageSyrupsList}`
    },
    {
        name: { en: "Sparkling Water 330ml", ar: "مياه فوارة 330 مل" },
        description: { en: "Carbonated mineral water", ar: "مياه معدنية فوارة" },
        price: 1.000,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Sparkling Water 750ml (San Pelegrino)", ar: "مياه فوارة 750 مل (سان بيليغرينو)" },
        description: { en: "Large San Pelegrino sparkling water", ar: "مياه سان بيليغرينو الفوارة الكبيرة" },
        price: 1.750,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Redbull", ar: "ريد بول" },
        description: { en: "Energy drink", ar: "مشروب طاقة" },
        price: 1.250,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer",
        addons: syrupAddons,
        note: `Available Syrups: ${beverageSyrupsList}`
    },
    {
        name: { en: "Barbican Beer (Non-alcoholic)", ar: "بربيكان (خالي من الكحول)" },
        description: { en: "Malt beverage", ar: "مشروب شعير" },
        price: 1.250,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Holsten Beer (Non-alcoholic)", ar: "هولستن (خالي من الكحول)" },
        description: { en: "Premium malt beverage", ar: "مشروب شعير ممتاز" },
        price: 1.250,
        category: "Refreshing Drinks",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Lipton Ice Tea Can", ar: "ليبتون آيس تي (علبة)" },
        description: { en: "Chilled canned ice tea", ar: "شاي مثلج معلب بارد" },
        price: 1.000,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    },
    {
        name: { en: "Extra Syrup", ar: "شراب إضافي (سيروب)" },
        description: { en: beverageSyrupsList, ar: "مانجو، خوخ، باشون فروت، موز، جوز هند، فراولة، توت بري" },
        price: 0.250,
        category: "Beverages",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/beverages.jpg",
        season: "Summer"
    }
];

async function seedRefreshingDrinksMenu() {
    console.log('💧 Starting Room Service Refreshing Drinks Seeding...\n');

    try {
        let count = 0;
        for (const item of refreshingDrinksItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} refreshing drink items to Room Service menu!`);
        console.log('\n✨ Soft Drinks and Redbull include syrup addon option (+0.250 KD)');

    } catch (error) {
        console.error('❌ Error seeding refreshing drinks menu:', error);
    }
}

// Run the seeding
seedRefreshingDrinksMenu();

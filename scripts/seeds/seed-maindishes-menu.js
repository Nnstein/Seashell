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

// Room Service Main Dishes Menu Items
const mainDishesItems = [
    {
        name: {
            en: "Vegetable Curry",
            ar: "كاري الخضار"
        },
        description: {
            en: "Vegetables in lightly spiced coconut milk curry served with papad and steamed rice",
            ar: "خضار في كاري حليب جوز الهند المتبل قليلاً يقدم مع بابادوم وأرز مطهو على البخار"
        },
        price: 4.000,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        tags: ["vegetarian"]
    },
    {
        name: {
            en: "Stir Fried Noodles",
            ar: "نودلز مقلي"
        },
        description: {
            en: "Chinese noodles sautéed with mixed vegetables, soya and oyster sauce",
            ar: "نودلز صيني مقلي مع خضار مشكلة وصلصة الصويا والمحار"
        },
        price: 3.750,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Grilled Chicken Breast",
            ar: "صدر دجاج مشوي"
        },
        description: {
            en: "Served with roasted potatoes and white rice, capsicum, mushroom and cherry olives with balsamic vinaigrette",
            ar: "يقدم مع بطاطس محمصة وأرز أبيض، فلفل رومي، فطر وزيتون كرزي مع صلصة البلسميك"
        },
        price: 4.500,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Lamb Chops",
            ar: "قطع لحم الضأن"
        },
        description: {
            en: "Marinated with herbs, served with roasted potatoes, sautéed vegetables and herb gravy",
            ar: "متبل بالأعشاب، يقدم مع بطاطس محمصة، خضار مقلية ومرق الأعشاب"
        },
        price: 7.000,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Beef Tenderloin",
            ar: "لحم بقري تندرلوين"
        },
        description: {
            en: "Served with mashed potatoes, sautéed vegetables and mushroom gravy or pepper sauce",
            ar: "يقدم مع بطاطس مهروسة، خضار مقلية ومرق الفطر أو صلصة الفلفل"
        },
        price: 6.500,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mongolian Beef",
            ar: "لحم بقري منغولي"
        },
        description: {
            en: "Thinly sliced Asian marinated beef served with broccoli and steamed rice",
            ar: "شرائح لحم بقري آسيوي متبل رقيقة تقدم مع بروكلي وأرز مطهو على البخار"
        },
        price: 6.250,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Mixed Grill",
            ar: "مشاوي مشكلة"
        },
        description: {
            en: "Platter of marinated and freshly grilled meats served with fries, grilled tomato, onion and chili",
            ar: "طبق من اللحوم المتبلة والمشوية الطازجة يقدم مع بطاطس مقلية، طماطم مشوية، بصل وفلفل حار"
        },
        price: 6.000,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Arrayes",
            ar: "عرايس"
        },
        description: {
            en: "Capsicum and minced meat with mint and tomatoes stuffed in bread and grilled",
            ar: "فلفل رومي ولحم مفروم مع نعناع وطماطم محشو في خبز ومشوي"
        },
        price: 3.250,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer"
    },
    {
        name: {
            en: "Tacos",
            ar: "تاكو"
        },
        description: {
            en: "Choice of Mexican spiced chicken, beef, shrimps or vegetables in a crispy shell with lettuce, tomatoes and cheese",
            ar: "اختيارك من دجاج، لحم بقري، جمبري أو خضار متبل مكسيكي في قشرة مقرمشة مع خس وطماطم وجبن"
        },
        price: 2.500, // Base price (vegetables)
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        sizes: [
            { name: "Vegetables", price: 2.500 },
            { name: "Chicken", price: 3.000 },
            { name: "Beef", price: 3.000 },
            { name: "Shrimp", price: 3.250 }
        ]
    },
    {
        name: {
            en: "Lentil Rice with Potato Muadas",
            ar: "أرز بالعدس مع بطاطس معدس"
        },
        description: {
            en: "Spiced lentils and rice with potato chunks",
            ar: "عدس وأرز متبل مع قطع البطاطس"
        },
        price: 3.000,
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        tags: ["traditional"]
    },
    {
        name: {
            en: "Biryani",
            ar: "برياني"
        },
        description: {
            en: "Long grain basmati rice cooked with spices with choice of lamb, chicken, shrimp or vegetables; served with raita, dakkous and papad",
            ar: "أرز بسمتي طويل الحبة مطبوخ مع البهارات مع اختيارك من لحم الضأن، دجاج، جمبري أو خضار؛ يقدم مع رايتا ودقوس وبابادوم"
        },
        price: 4.500, // Base price (chicken/shrimp/vegetables)
        category: "Main Course",
        menuType: "All Day",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/categories/main.jpg",
        season: "Summer",
        tags: ["nuts", "spicy"],
        note: "Nuts may be present",
        sizes: [
            { name: "Chicken", price: 4.500 },
            { name: "Lamb", price: 4.750 },
            { name: "Shrimp", price: 4.500 },
            { name: "Vegetables", price: 4.500 }
        ]
    }
];

async function seedMainDishesMenu() {
    console.log('🍛 Starting Room Service Main Dishes Menu Seeding...\n');

    try {
        let count = 0;
        for (const item of mainDishesItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            const tags = item.tags ? ` [${item.tags.join(', ')}]` : '';
            const sizes = item.sizes ? ` (${item.sizes.length} options)` : '';
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD)${tags}${sizes} - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} main dish items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- 11 Main Dishes');
        console.log('- Tacos: 4 protein options (Vegetables, Chicken, Beef, Shrimp)');
        console.log('- Biryani: 4 options (Chicken, Lamb, Shrimp, Vegetables)');
        console.log('- Tags: Vegetarian (1), Traditional (1), Nuts (1), Spicy (1)');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding main dishes menu:', error);
    }
}

// Run the seeding
seedMainDishesMenu();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');
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

// Room Service Breakfast Menu Items
const breakfastItems = [
    {
        name: {
            en: "Seashell Breakfast",
            ar: "فطور سيشل"
        },
        description: {
            en: "Brewed tea or coffee, orange juice, freshly baked croissant, danish, bread rolls, toast, butter and jams, cereal, muesli, yogurt, cheeses, eggs cooked your way, fresh fruits, bacon, sausages, potato, tomato, mushrooms",
            ar: "شاي أو قهوة مخمرة، عصير برتقال، كرواسون طازج، دانش، لفائف خبز، توست، زبدة ومربى، حبوب، موسلي، زبادي، أجبان، بيض مطبوخ حسب الطلب، فواكه طازجة، لحم مقدد، نقانق، بطاطس، طماطم، فطر"
        },
        price: 6.000,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-1.jpg",
        season: "Summer",
        note: "Availability: 06:30–11:00",
        // Special structure for Seashell Breakfast
        sizes: [
            { name: "Single Serving", price: 6.000 }
        ],
        addons: [
            { name: "Tea", price: 0 },
            { name: "Coffee", price: 0 },
            { name: "Scrambled Eggs", price: 0 },
            { name: "Fried Eggs", price: 0 },
            { name: "Omelette", price: 0 }
        ]
    },
    {
        name: {
            en: "Mediterranean Breakfast",
            ar: "فطور متوسطي"
        },
        description: {
            en: "Brewed tea or coffee, orange juice, freshly baked pastries with honey, jam and butter, hummus, white cheese, labneh, tomato, cucumber, olives and pickles, cold cuts, foul, boiled eggs, falafel, eggs cooked your way",
            ar: "شاي أو قهوة مخمرة، عصير برتقال، معجنات طازجة مع عسل ومربى وزبدة، حمص، جبنة بيضاء، لبنة، طماطم، خيار، زيتون ومخللات، لحوم باردة، فول، بيض مسلوق، فلافل، بيض مطبوخ حسب الطلب"
        },
        price: 5.500,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-2.jpg",
        season: "Summer",
        note: "Traditional Dish; Veg options available. Availability: 06:30–11:00",
        tags: ["traditional", "vegetarian"],
        // Special structure for Mediterranean Breakfast
        sizes: [
            { name: "Single Serving", price: 5.500 }
        ],
        addons: [
            { name: "Tea", price: 0 },
            { name: "Coffee", price: 0 },
            { name: "Scrambled Eggs", price: 0 },
            { name: "Fried Eggs", price: 0 },
            { name: "Omelette", price: 0 }
        ]
    },
    {
        name: {
            en: "Eggs",
            ar: "بيض"
        },
        description: {
            en: "Eggs cooked your way served with beef bacon, chicken sausages, potatoes, peppers, tomatoes, and mushrooms",
            ar: "بيض مطبوخ حسب الطلب يقدم مع لحم مقدد، نقانق دجاج، بطاطس، فلفل، طماطم، وفطر"
        },
        price: 2.000,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-3.jpg",
        season: "Summer",
        note: "Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Cheese Plate",
            ar: "طبق الأجبان"
        },
        description: {
            en: "Selection of international cheeses served with a freshly baked bread basket",
            ar: "تشكيلة من الأجبان العالمية تقدم مع سلة خبز طازجة"
        },
        price: 3.000,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-4.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Pastry Basket",
            ar: "سلة المعجنات"
        },
        description: {
            en: "Croissant, assorted Danish, cinnamon roll",
            ar: "كرواسون، دانش متنوع، لفائف القرفة"
        },
        price: 2.750,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-5.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Bread Corner - Baguette",
            ar: "ركن الخبز - باجيت"
        },
        description: {
            en: "Freshly baked baguette",
            ar: "باجيت طازج"
        },
        price: 1.100,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-6.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Bread Corner - Multi Cereal Loaf",
            ar: "ركن الخبز - رغيف متعدد الحبوب"
        },
        description: {
            en: "Multi cereal bread loaf",
            ar: "رغيف خبز متعدد الحبوب"
        },
        price: 1.250,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-7.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Bread Corner - Kraft Corn Loaf",
            ar: "ركن الخبز - رغيف الذرة كرافت"
        },
        description: {
            en: "Kraft corn bread loaf",
            ar: "رغيف خبز الذرة كرافت"
        },
        price: 1.250,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-8.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Bread Corner - Country Loaf",
            ar: "ركن الخبز - رغيف ريفي"
        },
        description: {
            en: "Country style bread loaf",
            ar: "رغيف خبز ريفي"
        },
        price: 1.250,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-9.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Pancakes & Waffles",
            ar: "فطائر ووافل"
        },
        description: {
            en: "Choose between pancakes or waffles with maple syrup, strawberries or chocolate sauce and fruits",
            ar: "اختر بين الفطائر أو الوافل مع شراب القيقب، الفراولة أو صلصة الشوكولاتة والفواكه"
        },
        price: 3.500,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-10.jpg",
        season: "Summer",
        note: "Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Cereal",
            ar: "حبوب الإفطار"
        },
        description: {
            en: "Your choice of Cornflakes, Rice Krispies, All Bran or Muesli; served with cold or hot milk",
            ar: "اختيارك من كورن فليكس، رايس كريسبيز، أول بران أو موسلي؛ يقدم مع حليب بارد أو ساخن"
        },
        price: 1.750,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-11.jpg",
        season: "Summer",
        note: "Nuts may be present. Availability: 06:30–11:00"
    },
    {
        name: {
            en: "Fresh Fruits",
            ar: "فواكه طازجة"
        },
        description: {
            en: "Platter of fresh seasonal fruits",
            ar: "طبق من الفواكه الموسمية الطازجة"
        },
        price: 1.500,
        category: "Breakfast",
        menuType: "Breakfast",
        menu: "room-service",
        isAvailable: true,
        image: "/assets/images/items/bk-12.jpg",
        season: "Summer",
        note: "Availability: 06:30–11:00"
    }
];

async function seedBreakfastMenu() {
    console.log('🍳 Starting Room Service Breakfast Menu Seeding...\n');

    try {
        // Set default menu to room-service
        await setDoc(doc(db, 'settings', 'global_settings'), {
            id: 'global_settings',
            activeSeason: 'Summer',
            activeMenu: 'room-service'
        });
        console.log('✅ Set active menu to room-service\n');

        let count = 0;
        for (const item of breakfastItems) {
            const docRef = await addDoc(collection(db, 'menu_items'), item);
            count++;
            console.log(`✅ Added: ${item.name.en} (${item.price.toFixed(3)} KD) - ID: ${docRef.id}`);
        }

        console.log(`\n🎉 Successfully added ${count} breakfast items to Room Service menu!`);
        console.log('\n📋 Summary:');
        console.log('- Seashell Breakfast: Special addons for tea/coffee and egg style');
        console.log('- Mediterranean Breakfast: Special addons for tea/coffee and egg style');
        console.log('- 10 other breakfast items with standard structure');
        console.log('\n✨ All items are tagged with menu: "room-service"');

    } catch (error) {
        console.error('❌ Error seeding breakfast menu:', error);
    }
}

// Run the seeding
seedBreakfastMenu();

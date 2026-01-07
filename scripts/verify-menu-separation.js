const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const dotenv = require('dotenv');

// Load environment variables
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

async function verifyMenuSeparation() {
    console.log('🔍 VERIFYING MENU SEPARATION\n');
    console.log('='.repeat(60));

    try {
        const querySnapshot = await getDocs(collection(db, 'menu_items'));

        const roomServiceItems = [];
        const prestoItems = [];
        const undefinedItems = [];

        // Categorize items by menu
        querySnapshot.forEach(doc => {
            const item = doc.data();
            const itemName = typeof item.name === 'object' ? item.name.en : item.name;
            const itemData = {
                id: doc.id,
                name: itemName,
                category: item.category,
                menu: item.menu
            };

            if (item.menu === 'room-service') {
                roomServiceItems.push(itemData);
            } else if (item.menu === 'presto') {
                prestoItems.push(itemData);
            } else {
                undefinedItems.push(itemData);
            }
        });

        // Display Room Service Menu
        console.log('\n📦 ROOM SERVICE MENU');
        console.log('-'.repeat(60));
        console.log(`Total Items: ${roomServiceItems.length}`);
        const rsCategories = [...new Set(roomServiceItems.map(i => i.category))].sort();
        console.log(`Categories (${rsCategories.length}): ${rsCategories.join(', ')}`);

        // Display Presto Menu
        console.log('\n📦 PRESTO MENU');
        console.log('-'.repeat(60));
        console.log(`Total Items: ${prestoItems.length}`);
        const prestoCategories = [...new Set(prestoItems.map(i => i.category))].sort();
        console.log(`Categories (${prestoCategories.length}): ${prestoCategories.join(', ')}`);

        // Find shared category names
        const sharedCategories = rsCategories.filter(c => prestoCategories.includes(c));
        if (sharedCategories.length > 0) {
            console.log('\n⚠️  SHARED CATEGORY NAMES (exist in both menus):');
            console.log('-'.repeat(60));
            sharedCategories.forEach(cat => {
                const rsCount = roomServiceItems.filter(i => i.category === cat).length;
                const prestoCount = prestoItems.filter(i => i.category === cat).length;
                console.log(`  "${cat}" - Room Service: ${rsCount} items, Presto: ${prestoCount} items`);
            });
            console.log('\n  ✅ These items are SEPARATE in DB (different "menu" field values)');
            console.log('  ✅ Editing one will NOT affect the other');
        }

        // Show any undefined items
        if (undefinedItems.length > 0) {
            console.log('\n⚠️  ITEMS WITHOUT MENU FIELD:');
            console.log('-'.repeat(60));
            undefinedItems.forEach(item => {
                console.log(`  - ${item.name} (${item.category}) [ID: ${item.id}]`);
            });
            console.log('\n  These items need to be assigned to a menu!');
        } else {
            console.log('\n✅ All items have a menu field assigned!');
        }

        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION COMPLETE');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error);
    }
}

verifyMenuSeparation();

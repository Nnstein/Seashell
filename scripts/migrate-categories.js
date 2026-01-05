const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
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

// Keywords to identify item types (based on item names)
const SMOOTHIE_KEYWORDS = ['smoothie', 'passion fruit', 'peach', 'mango', 'red berries', 'blueberry', 'strawberry', 'coconut', 'banana'];
const MILKSHAKE_KEYWORDS = ['milkshake', 'shake', 'oreo'];
const MOCKTAIL_KEYWORDS = ['mojito', 'cocktail', 'bluetooth', 'ice tea', 'margarita', 'lemonade', 'colada'];
const REFRESHING_KEYWORDS = ['water', 'soft drink', 'sparkling', 'redbull', 'red bull', 'barbican', 'holsten', 'beer'];
const CHAI_LATTE_KEYWORDS = ['chai latte', 'chai', 'latte'];
const SEAFOOD_KEYWORDS = ['fish', 'shrimp', 'prawns', 'salmon', 'hamour', 'calamari', 'sea bass', 'seafood', 'lobster', 'crab', 'machboos'];
const SANDWICH_KEYWORDS = ['sandwich', 'wrap', 'club', 'shawarma', 'ciabatta', 'panini', 'toast', 'baguette'];
const BURGER_KEYWORDS = ['burger', 'wagyu'];

function getItemName(item) {
    if (typeof item.name === 'object' && item.name !== null) {
        return (item.name.en || '').toLowerCase();
    }
    return (item.name || '').toLowerCase();
}

function matchesKeywords(name, keywords) {
    return keywords.some(keyword => name.includes(keyword.toLowerCase()));
}

function determineNewCategory(item) {
    const name = getItemName(item);
    const currentCategory = item.category;

    // Only migrate items from old categories
    if (currentCategory === 'Beverages') {
        if (matchesKeywords(name, SMOOTHIE_KEYWORDS)) return 'Smoothies';
        if (matchesKeywords(name, MILKSHAKE_KEYWORDS)) return 'Milkshakes';
        if (matchesKeywords(name, MOCKTAIL_KEYWORDS)) return 'Mocktails';
        if (matchesKeywords(name, REFRESHING_KEYWORDS)) return 'Refreshing Drinks';
        if (matchesKeywords(name, CHAI_LATTE_KEYWORDS)) return 'Chai Latte';
        // Default for remaining beverages - keep as Beverages (Fresh Juices)
        return 'Beverages';
    }

    if (currentCategory === 'Main Course') {
        if (matchesKeywords(name, SEAFOOD_KEYWORDS)) return 'Seafood';
        if (matchesKeywords(name, SANDWICH_KEYWORDS)) return 'Sandwiches';
        if (matchesKeywords(name, BURGER_KEYWORDS)) return 'Burgers';
        // Default - keep as Main Course for actual main dishes
        return 'Main Course';
    }

    if (currentCategory === 'Kids') {
        // Kids category is already correct
        return 'Kids';
    }

    // All other categories remain unchanged
    return currentCategory;
}

async function migrateCategories() {
    console.log('🔄 Starting Category Migration...\n');
    console.log('This script will update item categories to match the new 17-category structure.\n');

    try {
        // Fetch all menu items
        const querySnapshot = await getDocs(collection(db, 'menu_items'));
        console.log(`📊 Found ${querySnapshot.size} total items in database.\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        const migrations = {
            'Smoothies': [],
            'Milkshakes': [],
            'Mocktails': [],
            'Refreshing Drinks': [],
            'Chai Latte': [],
            'Seafood': [],
            'Sandwiches': [],
            'Burgers': []
        };

        for (const docSnapshot of querySnapshot.docs) {
            const item = docSnapshot.data();
            const itemName = getItemName(item);
            const oldCategory = item.category;
            const newCategory = determineNewCategory(item);

            // Only update if category changed
            if (oldCategory !== newCategory) {
                // Update in Firestore
                const docRef = doc(db, 'menu_items', docSnapshot.id);
                await updateDoc(docRef, { category: newCategory });

                updatedCount++;
                if (migrations[newCategory]) {
                    migrations[newCategory].push(itemName);
                }
                console.log(`✅ ${itemName}: "${oldCategory}" → "${newCategory}"`);
            } else {
                skippedCount++;
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Updated: ${updatedCount} items`);
        console.log(`⏭️  Skipped: ${skippedCount} items (no change needed)\n`);

        console.log('📦 Items migrated to new categories:');
        for (const [category, items] of Object.entries(migrations)) {
            if (items.length > 0) {
                console.log(`\n  ${category} (${items.length} items):`);
                items.forEach(name => console.log(`    - ${name}`));
            }
        }

        console.log('\n✨ Migration Complete!');
        console.log('Your database now uses the 17-category structure.');

    } catch (error) {
        console.error('❌ Error during migration:', error);
    }
}

// Run the migration
migrateCategories();

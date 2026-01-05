const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
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

async function fixPrestoMenuItems() {
    console.log('🔧 Starting Presto Menu Fix Script...\n');

    try {
        // Get all menu items
        const querySnapshot = await getDocs(collection(db, 'menu_items'));
        let updateCount = 0;
        let skippedCount = 0;

        console.log(`📊 Scanning ${querySnapshot.size} total items...`);

        // Process updates in chunks to avoid overwhelming the connection
        const updates = [];

        querySnapshot.forEach((document) => {
            const data = document.data();

            // Check if 'menu' field is missing or undefined
            // AND ensure it's not one of our new Room Service items
            if (!data.menu || data.menu === undefined) {
                const itemRef = doc(db, 'menu_items', document.id);

                // Add update promise to array
                const updatePromise = updateDoc(itemRef, {
                    menu: 'presto' // Tag as Presto
                }).then(() => {
                    console.log(`✅ Updated: ${data.name.en || 'Unknown Item'} (ID: ${document.id})`);
                }).catch((err) => {
                    console.error(`❌ Failed to update ${document.id}:`, err);
                });

                updates.push(updatePromise);
                updateCount++;
            } else {
                skippedCount++;
            }
        });

        if (updateCount > 0) {
            console.log(`\n⏳ Processing ${updateCount} updates...`);
            await Promise.all(updates);
            console.log(`\n🎉 Successfully fixed ${updateCount} Presto menu items!`);
        } else {
            console.log('\n✨ No items needed fixing. All items already have a menu tag.');
        }

        console.log(`\n📋 Summary:`);
        console.log(`- Updated: ${updateCount}`);
        console.log(`- Skipped (already tagged): ${skippedCount}`);

    } catch (error) {
        console.error('❌ Error fixing menu items:', error);
    }
}

fixPrestoMenuItems();

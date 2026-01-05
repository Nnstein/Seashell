const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const dotenv = require('dotenv');
const fs = require('fs');

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

async function checkDatabase() {
    const reportPath = 'db_verify_report.txt';
    let report = '🔍 Checking Firestore Database Contents...\n\n';
    console.log('🔍 Checking Firestore Database Contents...');

    try {
        const querySnapshot = await getDocs(collection(db, 'menu_items'));

        let roomServiceCount = 0;
        let prestoCount = 0;
        let otherCount = 0;

        const roomServiceCategories = {};
        const prestoCategories = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const menu = data.menu;
            const category = data.category;

            if (menu === 'room-service') {
                roomServiceCount++;
                roomServiceCategories[category] = (roomServiceCategories[category] || 0) + 1;
            } else if (menu === 'presto') {
                prestoCount++;
                prestoCategories[category] = (prestoCategories[category] || 0) + 1;
            } else {
                otherCount++;
                report += `⚠️ Found item with unknown menu '${menu}': ${data.name.en} (ID: ${doc.id})\n`;
            }
        });

        report += '📊 Database Summary:\n';
        report += '----------------------------------------\n';
        report += `🏠 Room Service Items: ${roomServiceCount}\n`;
        Object.entries(roomServiceCategories).forEach(([cat, count]) => {
            report += `   - ${cat}: ${count}\n`;
        });

        report += '\n----------------------------------------\n';
        report += `🚀 Presto Items: ${prestoCount}\n`;
        Object.entries(prestoCategories).forEach(([cat, count]) => {
            report += `   - ${cat}: ${count}\n`;
        });

        if (otherCount > 0) {
            report += '\n----------------------------------------\n';
            report += `❓ Other/Undefined Menu Items: ${otherCount}\n`;
        }

        report += '\n----------------------------------------\n';
        report += `Total Items in DB: ${querySnapshot.size}\n`;

        fs.writeFileSync(reportPath, report);
        console.log(`✅ Report saved to ${reportPath}`);

    } catch (error) {
        console.error('❌ Error reading database:', error);
    }
}

checkDatabase();

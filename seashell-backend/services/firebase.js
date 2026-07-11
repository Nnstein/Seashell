/**
 * Firebase Admin Service
 * Handles server-side interaction with Firestore
 */

const admin = require('firebase-admin');

// Check if Firebase has already been initialized
if (!admin.apps.length) {
    try {
        // In production/Vercel, we use environment variables for configuration
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            console.log('✅ Firebase Admin initialized successfully.');
        } else {
            console.error('❌ CRITICAL: Firebase environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are missing.');
            console.log('Please check your .env.local file.');
            // We don't exit here to allow the process to stay alive if needed, 
            // but db access will fail later. 
        }
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
    }
}

// Get DB instance safely
let db;
try {
    if (admin.apps.length > 0) {
        db = admin.firestore();
    } else {
        // Create a dummy object for db to prevent immediate crashes in route files
        // but it will fail when called, which is expected if not initialized.
        db = new Proxy({}, {
            get: function(target, prop) {
                return () => { throw new Error('Firestore used before Firebase Admin was initialized. Check your environment variables.'); };
            }
        });
    }
} catch (e) {
    console.error('Failed to get Firestore instance:', e.message);
}

/**
 * Collection Names
 */
const COLLECTIONS = {
    ORDERS: 'orders',
    SETTINGS: 'settings'
};

module.exports = {
    admin,
    db,
    COLLECTIONS
};

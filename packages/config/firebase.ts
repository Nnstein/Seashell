import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "seashell-meal-menu.firebaseapp.com",
  projectId: "seashell-meal-menu",
  storageBucket: "seashell-meal-menu.firebasestorage.app",
  messagingSenderId: "83327034076",
  appId: "1:83327034076:web:356447990aa5dd0cc10a19",
  measurementId: "G-KFRGD94EHC",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Initialize Firestore with persistent cache (newer API - no deprecation warning!)
// This dramatically reduces Firestore reads by caching data in IndexedDB
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager() // Supports multiple tabs!
    })
});

export const storage = getStorage(app);

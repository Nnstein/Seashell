/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "seashell-meal-menu.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seashell-meal-menu",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "seashell-meal-menu.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "83327034076",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:83327034076:web:356447990aa5dd0cc10a19",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KFRGD94EHC",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Only initialize Analytics if the environment supports it (requires IndexedDB).
// This prevents the console warning in private/restricted browsers.
export let analytics: Analytics | null = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager() // Supports multiple tabs!
    })
});

export const storage = getStorage(app);
export const auth = getAuth(app);

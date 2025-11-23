import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBLqg7SLkSavkPKU9HawOzZVauXREYDKMg",
    authDomain: "seashell-meal-menu.firebaseapp.com",
    projectId: "seashell-meal-menu",
    storageBucket: "seashell-meal-menu.firebasestorage.app",
    messagingSenderId: "83327034076",
    appId: "1:83327034076:web:356447990aa5dd0cc10a19",
    measurementId: "G-KFRGD94EHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

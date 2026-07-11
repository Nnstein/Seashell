import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, where, Timestamp, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "seashell-meal-menu.firebaseapp.com",
  projectId: "seashell-meal-menu",
  storageBucket: "seashell-meal-menu.firebasestorage.app",
  messagingSenderId: "83327034076",
  appId: "1:83327034076:web:356447990aa5dd0cc10a19",
  measurementId: "G-KFRGD94EHC",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cloneMenu() {
    console.log("Fetching room-service items...");
    const itemsRef = collection(db, "menu_items");
    const q = query(itemsRef, where("menu", "==", "room-service"));
    const snapshot = await getDocs(q);
    
    console.log(`Found ${snapshot.size} room-service items to clone.`);
    
    // Clear existing seashell items
    console.log("Checking for existing seashell items to clear...");
    const seashellQuery = query(itemsRef, where("menu", "==", "seashell"));
    const seashellSnapshot = await getDocs(seashellQuery);
    
    if (seashellSnapshot.size > 0) {
        console.log(`Deleting ${seashellSnapshot.size} existing seashell items...`);
        for (const docSnap of seashellSnapshot.docs) {
            await deleteDoc(doc(db, "menu_items", docSnap.id));
        }
        console.log("Existing seashell items cleared.");
    }
    
    let count = 0;
    for (const docSnapshot of snapshot.docs) {
        const itemData = docSnapshot.data();
        
        // Change menu reference
        itemData.menu = "seashell";
        
        // Make sure it doesn't try to reuse existing id field
        delete itemData.id;
        
        // Provide fresh timestamps just in case the backend cares
        itemData.createdAt = Timestamp.now();
        itemData.updatedAt = Timestamp.now();
        
        await addDoc(itemsRef, itemData);
        count++;
        
        const itemName = typeof itemData.name === 'object' ? itemData.name.en || "[Missing EN Name]" : itemData.name;
        console.log(`Cloned: ${itemName} (${count}/${snapshot.size})`);
    }
    
    console.log("✨ Successfully copied room-service contents to Seashell menu.");
    process.exit(0);
}

cloneMenu().catch((err) => {
    console.error("Failed to clone menu items:", err);
    process.exit(1);
});

import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { MenuItem, Order, Guest, MenuSettings } from '../src/types';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const GUESTS_COLLECTION = 'guests';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';

// --- Menu Items ---

export const getMenuItems = async (): Promise<MenuItem[]> => {
    console.log("DEBUG: Fetching menu items from", MENU_COLLECTION);
    try {
        const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
        console.log("DEBUG: Menu items fetched. Count:", querySnapshot.size);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        console.log("DEBUG: Parsed menu items:", items);
        return items;
    } catch (error) {
        console.error("DEBUG: Error fetching menu items:", error);
        return [];
    }
};

export const addMenuItem = async (item: MenuItem) => {
    return await addDoc(collection(db, MENU_COLLECTION), {
        ...item,
        createdAt: Timestamp.now()
    });
};

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const docRef = doc(db, MENU_COLLECTION, id);
    return await updateDoc(docRef, updates);
};

export const deleteMenuItem = async (id: string) => {
    const docRef = doc(db, MENU_COLLECTION, id);
    return await deleteDoc(docRef);
};

// --- Orders ---

export const getOrders = async (): Promise<Order[]> => {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const updateOrderStatus = async (id: string, status: Order['status']) => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    return await updateDoc(docRef, { status });
};

// --- Guests ---

export const getGuests = async (): Promise<Guest[]> => {
    const querySnapshot = await getDocs(collection(db, GUESTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
};

export const addGuest = async (guest: Guest) => {
    return await addDoc(collection(db, GUESTS_COLLECTION), {
        ...guest,
        checkInDate: Timestamp.now(), // Default to now if not provided
        isActive: true
    });
};

// --- Settings ---

export const getMenuSettings = async (): Promise<MenuSettings | null> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as MenuSettings;
        } else {
            // Create default settings if not exists
            const defaultSettings: MenuSettings = {
                id: GLOBAL_SETTINGS_ID,
                activeSeason: 'Summer'
            };
            await setDoc(docRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const updateMenuSettings = async (updates: Partial<MenuSettings>) => {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    return await updateDoc(docRef, updates);
};

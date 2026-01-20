import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { MenuItem, Order, MenuSettings } from '../src/types';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';

// --- Menu Items ---

export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
    const q = query(collection(db, MENU_COLLECTION), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
};

// --- Settings ---

export const getMenuSettings = async (): Promise<MenuSettings | null> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as MenuSettings;
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

// --- Orders ---

export const placeOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    return await addDoc(collection(db, ORDERS_COLLECTION), {
        ...order,
        status: 'pending',
        createdAt: Timestamp.now()
    });
};

import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp, getDoc, setDoc, limit, startAfter } from 'firebase/firestore';
import { MenuItem, Order, Guest, MenuSettings } from '../src/types';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const ORDER_HISTORY_COLLECTION = 'order_history';
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

// --- Order History ---

export const getOrderHistory = async (): Promise<Order[]> => {
    const q = query(collection(db, ORDER_HISTORY_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrderHistoryPaginated = async (pageSize: number = 20, lastDoc?: any): Promise<{ orders: Order[], lastDoc: any, hasMore: boolean }> => {
    try {
        let q;
        if (lastDoc) {
            q = query(
                collection(db, ORDER_HISTORY_COLLECTION),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        } else {
            q = query(
                collection(db, ORDER_HISTORY_COLLECTION),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Order));
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        const hasMore = querySnapshot.docs.length === pageSize;

        return { orders, lastDoc: lastVisible, hasMore };
    } catch (error) {
        console.error('Error fetching paginated order history:', error);
        return { orders: [], lastDoc: null, hasMore: false };
    }
};

export const archiveCompletedOrders = async (): Promise<number> => {
    try {
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

        // Get all completed orders
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('status', '==', 'completed')
        );
        const querySnapshot = await getDocs(q);

        let archivedCount = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const order = { id: docSnapshot.id, ...docSnapshot.data() } as Order;

            // Get order timestamp
            let orderTime: number;
            if (typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt) {
                orderTime = (order.createdAt as any).seconds * 1000;
            } else {
                orderTime = typeof order.createdAt === 'number' ? order.createdAt : now;
            }

            // Archive if older than 24 hours
            if (orderTime < twentyFourHoursAgo) {
                // Add to history collection
                await setDoc(doc(db, ORDER_HISTORY_COLLECTION, order.id), {
                    ...order,
                    archivedAt: Timestamp.now()
                });

                // Delete from orders collection
                await deleteDoc(doc(db, ORDERS_COLLECTION, order.id));
                archivedCount++;
            }
        }

        return archivedCount;
    } catch (error) {
        console.error("Error archiving orders:", error);
        throw error;
    }
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

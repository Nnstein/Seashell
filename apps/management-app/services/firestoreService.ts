import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp, getDoc, setDoc, limit, startAfter, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { MenuItem, Order, Guest, MenuSettings } from '../src/types';
import { MenuItemSchema, OrderSchema, GuestSchema, MenuSettingsSchema, safeParse } from '../src/schemas';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const ORDER_HISTORY_COLLECTION = 'order_history';
const GUESTS_COLLECTION = 'guests';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';

// ============================================
// Type-safe document parsing helpers
// ============================================

/**
 * Parse a Firestore document to MenuItem with validation
 */
const parseMenuItem = (docSnapshot: QueryDocumentSnapshot): MenuItem | null => {
    const data = { id: docSnapshot.id, ...docSnapshot.data() };
    const result = MenuItemSchema.safeParse(data);
    if (!result.success) {
        console.warn(`Invalid menu item ${docSnapshot.id}:`, result.error.format());
        // Return data as-is for backward compatibility, but log the issue
        return data as MenuItem;
    }
    return result.data as MenuItem;
};

/**
 * Parse a Firestore document to Order with validation
 */
const parseOrder = (docSnapshot: QueryDocumentSnapshot): Order | null => {
    const data = { id: docSnapshot.id, ...docSnapshot.data() };
    const result = OrderSchema.safeParse(data);
    if (!result.success) {
        console.warn(`Invalid order ${docSnapshot.id}:`, result.error.format());
        return data as Order;
    }
    return result.data as Order;
};

/**
 * Parse a Firestore document to Guest with validation
 */
const parseGuest = (docSnapshot: QueryDocumentSnapshot): Guest | null => {
    const data = { id: docSnapshot.id, ...docSnapshot.data() };
    const result = GuestSchema.safeParse(data);
    if (!result.success) {
        console.warn(`Invalid guest ${docSnapshot.id}:`, result.error.format());
        return data as Guest;
    }
    return result.data as Guest;
};

// --- Menu Items ---

export const getMenuItems = async (): Promise<MenuItem[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
        const items = querySnapshot.docs
            .map(parseMenuItem)
            .filter((item): item is MenuItem => item !== null);
        return items;
    } catch (error) {
        console.error("Error fetching menu items:", error);
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
    return querySnapshot.docs
        .map(parseOrder)
        .filter((order): order is Order => order !== null);
};

export const updateOrderStatus = async (id: string, status: Order['status']) => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    return await updateDoc(docRef, { status });
};

/**
 * Toggle VIP status on an order
 * Allows managers to mark important orders for priority handling
 */
export const toggleOrderVIP = async (id: string, isVIP: boolean) => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    return await updateDoc(docRef, { isVIP });
};

// --- Order History ---

export const getOrderHistory = async (): Promise<Order[]> => {
    const q = query(collection(db, ORDER_HISTORY_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(parseOrder)
        .filter((order): order is Order => order !== null);
};

export const getOrderHistoryPaginated = async (
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
): Promise<{ orders: Order[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> => {
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
        const orders = querySnapshot.docs
            .map(parseOrder)
            .filter((order): order is Order => order !== null);
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        const hasMore = querySnapshot.docs.length === pageSize;

        return { orders, lastDoc: lastVisible, hasMore };
    } catch (error) {
        console.error('Error fetching paginated order history:', error);
        return { orders: [], lastDoc: null, hasMore: false };
    }
};

export const archiveCompletedOrders = async (): Promise<number> => {
    try {
        // Get the start of today (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = today.getTime();

        // Query only for 'completed' status to avoid composite index requirement
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('status', '==', 'completed')
        );

        const querySnapshot = await getDocs(q);

        // Filter by date locally
        const ordersToArchive = querySnapshot.docs.filter(docSnapshot => {
            const data = docSnapshot.data();
            const createdAt = data.createdAt;

            // Handle both number and Firestore Timestamp
            const createdTime = (createdAt instanceof Timestamp)
                ? createdAt.toMillis()
                : (typeof createdAt === 'number' ? createdAt : 0);

            return createdTime < startOfToday;
        });

        let archivedCount = 0;
        console.log(`DEBUG: Found ${ordersToArchive.length} completed orders from before today out of ${querySnapshot.docs.length} total completed orders.`);

        for (const docSnapshot of ordersToArchive) {
            const order = parseOrder(docSnapshot);
            if (!order) continue;

            // Add to history collection
            await setDoc(doc(db, ORDER_HISTORY_COLLECTION, order.id), {
                ...order,
                archivedAt: Timestamp.now()
            });

            // Delete from orders collection
            await deleteDoc(doc(db, ORDERS_COLLECTION, order.id));
            archivedCount++;
        }

        if (archivedCount > 0) {
            console.log(`✅ Successfully archived ${archivedCount} completed orders from yesterday to history.`);
        } else {
            console.log('ℹ️ No old completed orders to archive today.');
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
    return querySnapshot.docs
        .map(parseGuest)
        .filter((guest): guest is Guest => guest !== null);
};

export const addGuest = async (guest: Guest) => {
    return await addDoc(collection(db, GUESTS_COLLECTION), {
        ...guest,
        checkInDate: Timestamp.now(),
        isActive: true
    });
};

// --- Settings ---

export const getMenuSettings = async (): Promise<MenuSettings | null> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            const result = MenuSettingsSchema.safeParse(data);
            if (!result.success) {
                console.warn('Invalid settings:', result.error.format());
                return data as MenuSettings;
            }
            return result.data as MenuSettings;
        } else {
            // Create default settings if not exists
            const defaultSettings: MenuSettings = {
                id: GLOBAL_SETTINGS_ID,
                activeSeason: 'Summer',
                activeMenu: 'room-service',
                menuOpen: true
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

/**
 * Count pending orders (not completed or cancelled)
 * Used for determining when to open/close menu based on kitchen capacity
 */
export const getPendingOrdersCount = async (): Promise<number> => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('status', 'in', ['pending', 'preparing', 'ready'])
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error counting pending orders:", error);
        return 0;
    }
};

/**
 * Toggle menu open/closed status
 * Used for kitchen capacity management
 * @param isOpen - Whether menu should be open
 * @param closeMessage - Optional custom message (English) when menu is closed
 */
export const setMenuStatus = async (isOpen: boolean, closeMessage?: string) => {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    const updates: any = { menuOpen: isOpen };
    
    // If closing and message provided, save it
    if (!isOpen && closeMessage) {
        updates.closeMessage = closeMessage;
    }
    
    return await updateDoc(docRef, updates);
};

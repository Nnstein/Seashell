import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp, getDoc, setDoc, limit, startAfter, DocumentSnapshot, QueryDocumentSnapshot, arrayUnion } from 'firebase/firestore';
import { MenuItem, Order, Guest, MenuSettings } from '../src/types';
import { MenuItemSchema, OrderSchema, GuestSchema, MenuSettingsSchema, safeParse } from '../src/schemas';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const ORDER_HISTORY_COLLECTION = 'order_history';
const GUESTS_COLLECTION = 'guests';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';
const SECTIONS_COLLECTION = 'sections';

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
        console.error(`CRITICAL: Malformed menu item ${docSnapshot.id}:`, result.error.format());
        return null; // Stop propagation of invalid data
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
        console.error(`CRITICAL: Malformed order ${docSnapshot.id}:`, result.error.format());
        return null; // Stop propagation of invalid data
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
        console.error(`CRITICAL: Malformed guest record ${docSnapshot.id}:`, result.error.format());
        return null; // Stop propagation of invalid data
    }
    return result.data as Guest;
};

import { LocationSection } from '../src/types';
import { LocationSectionSchema } from '../src/schemas';

/**
 * Parse a Firestore document to LocationSection with validation
 */
const parseLocationSection = (docSnapshot: QueryDocumentSnapshot): LocationSection | null => {
    const data = { id: docSnapshot.id, ...docSnapshot.data() };
    const result = LocationSectionSchema.safeParse(data);
    if (!result.success) {
        console.error(`CRITICAL: Malformed section record ${docSnapshot.id}:`, result.error.format());
        return null; 
    }
    return result.data as LocationSection;
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

/**
 * Helper to notify the system that the menu has changed.
 * This "busts" the cache for all guests.
 */
const bumpMenuVersion = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        await updateDoc(docRef, { 
            lastMenuUpdate: Date.now() 
        });
    } catch (e) {
        console.warn("Failed to bump menu version:", e);
        throw e;
    }
};

export const addMenuItem = async (item: MenuItem) => {
    try {
        const result = await addDoc(collection(db, MENU_COLLECTION), {
            ...item,
            createdAt: Timestamp.now()
        });
        await bumpMenuVersion();
        return result;
    } catch (error) {
        console.error("Error adding menu item:", error);
        throw error;
    }
};

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
        const docRef = doc(db, MENU_COLLECTION, id);
        const result = await updateDoc(docRef, updates);
        await bumpMenuVersion();
        return result;
    } catch (error) {
        console.error("Error updating menu item:", error);
        throw error;
    }
};

export const deleteMenuItem = async (id: string) => {
    try {
        const docRef = doc(db, MENU_COLLECTION, id);
        const result = await deleteDoc(docRef);
        await bumpMenuVersion();
        return result;
    } catch (error) {
        console.error("Error deleting menu item:", error);
        throw error;
    }
};

// --- Orders ---

export const getOrders = async (): Promise<Order[]> => {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(parseOrder)
        .filter((order): order is Order => order !== null);
};

export const syncOutletPendingStatus = async (menuOutlet: string) => {
    if (!menuOutlet) return;
    try {
        // Count pending orders for this menu
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('menu', '==', menuOutlet),
            where('status', 'in', ['pending', 'preparing', 'ready'])
        );
        const snapshot = await getDocs(q);
        const pendingCount = snapshot.size;

        const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const settingsDoc = await getDoc(settingsRef);
        if (!settingsDoc.exists()) return;

        const settings = settingsDoc.data();
        let menuStatus = settings.menuStatus || {};
        let currentStatus = menuStatus[menuOutlet] || { isOpen: true };

        let shouldUpdate = false;
        const updates: any = {};

        // Store pending count for prep time calculation in menu-app
        const pendingCounts = settings.pendingCounts || {};
        if (pendingCounts[menuOutlet] !== pendingCount) {
            pendingCounts[menuOutlet] = pendingCount;
            updates['pendingCounts'] = pendingCounts;
            shouldUpdate = true;
        }

        // Auto-close if >= 10
        if (pendingCount >= 10 && currentStatus.isOpen) {
            currentStatus.isOpen = false;
            currentStatus.closeMessage = "Due to a high volume of orders, this outlet is temporarily paused. Please try again in a few minutes.";
            currentStatus.autoClosed = true;
            menuStatus[menuOutlet] = currentStatus;
            updates['menuStatus'] = menuStatus;
            shouldUpdate = true;
        }
        // Auto-reopen if drops to <= 7 and was autoClosed
        else if (pendingCount <= 7 && !currentStatus.isOpen && currentStatus.autoClosed) {
            currentStatus.isOpen = true;
            currentStatus.closeMessage = "";
            currentStatus.autoClosed = false;
            menuStatus[menuOutlet] = currentStatus;
            updates['menuStatus'] = menuStatus;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            updates['lastMenuUpdate'] = Date.now();
            await updateDoc(settingsRef, updates);
        }
    } catch (e) {
        console.error("Error syncing outlet pending status:", e);
    }
};

export const updateOrderStatus = async (id: string, status: Order['status']) => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const user = auth.currentUser;
    
    // Fetch current status for the audit trail
    const docSnap = await getDoc(docRef);
    const previousStatus = docSnap.exists() ? docSnap.data().status : 'unknown';
    const menuOutlet = docSnap.exists() ? docSnap.data().menu : null;

    const result = await updateDoc(docRef, { 
        status,
        updatedAt: Timestamp.now(),
        // Security Audit Trail
        history: arrayUnion({
            from: previousStatus,
            to: status,
            timestamp: Timestamp.now(),
            userId: user?.uid || 'system',
            userEmail: user?.email || 'system'
        })
    });

    if (menuOutlet) {
        await syncOutletPendingStatus(menuOutlet);
    }

    return result;
};

/**
 * Toggle VIP status on an order
 * Allows managers to mark important orders for priority handling
 */
export const toggleOrderVIP = async (id: string, isVIP: boolean) => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    return await updateDoc(docRef, { isVIP });
};

/**
 * Update the line items of a completed order (guest changed mind after payment).
 * The totalAmount must stay the same — this is a like-for-like item swap.
 * An audit entry is added to the order's history array.
 */
export const updateOrderItems = async (
    id: string,
    newItems: Order['items'],
    note: string
): Promise<void> => {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const user = auth.currentUser;
    await updateDoc(docRef, {
        items: newItems,
        itemsEditedAt: Timestamp.now(),
        itemsEditNote: note,
        history: arrayUnion({
            from: 'completed',
            to: 'completed',
            note: note || 'Items updated after payment',
            timestamp: Timestamp.now(),
            userId: user?.uid || 'system',
            userEmail: user?.email || 'system'
        })
    });
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
        
        // SERVER-SIDE FILTERING: Fetch completed orders (avoids composite index requirement)
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('status', '==', 'completed')
        );

        const querySnapshot = await getDocs(q);
        
        // IN-MEMORY FILTERING: Only archive orders from before today
        const ordersToArchive = querySnapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return false;
            
            const createdAtTime = typeof data.createdAt.toMillis === 'function' 
                ? data.createdAt.toMillis() 
                : (data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt);
                
            return createdAtTime < today.getTime();
        });

        let archivedCount = 0;
        console.log(`DEBUG: Found ${ordersToArchive.length} completed orders from before today for archiving.`);

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
            console.log(`✅ Successfully archived ${archivedCount} completed orders to history.`);
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
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        return await updateDoc(docRef, {
            ...updates,
            lastMenuUpdate: Date.now()
        });
    } catch (error) {
        console.error("Error updating menu settings:", error);
        throw error;
    }
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
 * Toggle menu open/closed status for a specific menu
 * @param menu - The menu to toggle ('presto', 'room-service', 'seashell')
 */
export const setMenuStatus = async (menu: 'presto' | 'room-service' | 'seashell', isOpen: boolean, closeMessage?: string) => {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    // Get current settings first to update specific menu status
    const docSnap = await getDoc(docRef);
    let menuStatus = docSnap.exists() ? docSnap.data().menuStatus || {} : {};
    
    menuStatus[menu] = {
        isOpen,
        closeMessage: closeMessage || ''
    };
    
    return await updateDoc(docRef, { menuStatus });
};

/**
 * Create or update a staff account via the secure backend
 * SECURE: Uses the current Admin's Firebase ID Token for verification
 */
export const manageStaffAccount = async (role: string, password: string, email?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage staff.');

    // Get the fresh ID token for the current user
    const idToken = await user.getIdToken();

    // In production, the backend URL should be set via environment variables
    const backendUrl = 'https://seashell-backend.vercel.app'; 

    const response = await fetch(`${backendUrl}/payment/admin/create-staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ role, password, email })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to manage staff account');
    }

    return result;
};

// ============================================
// LOCATIONS & SECTIONS
// ============================================

export const getSections = async (): Promise<LocationSection[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, SECTIONS_COLLECTION));
        return querySnapshot.docs
            .map(parseLocationSection)
            .filter((section): section is LocationSection => section !== null);
    } catch (error) {
        console.error("Error fetching sections: ", error);
        return [];
    }
};

export const addSection = async (section: Omit<LocationSection, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, SECTIONS_COLLECTION), section);
        return docRef.id;
    } catch (error) {
        console.error("Error adding section: ", error);
        throw error;
    }
};

export const updateSection = async (id: string, updates: Partial<LocationSection>) => {
    try {
        await updateDoc(doc(db, SECTIONS_COLLECTION, id), updates);
    } catch (error) {
        console.error("Error updating section: ", error);
        throw error;
    }
};

export const deleteSection = async (id: string) => {
    try {
        await deleteDoc(doc(db, SECTIONS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting section: ", error);
        throw error;
    }
};

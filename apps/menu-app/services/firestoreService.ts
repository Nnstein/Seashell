import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { MenuItem, Order, MenuSettings } from '../src/types';
import { getCachedData, setCachedData, CACHE_KEYS, CACHE_TTL } from '@seashell/config/cacheUtils';

// Collection References
const MENU_COLLECTION = 'menu_items';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';

// --- Menu Items ---

/**
 * Get available menu items with smart caching
 * - First checks localStorage cache (24hr TTL)
 * - Only fetches from Firestore if cache miss/expired
 * - Dramatically reduces reads: ~50 reads → ~2 reads per day
 */
export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
    // Try cache first
    const cached = getCachedData<MenuItem[]>(CACHE_KEYS.MENU_ITEMS, CACHE_TTL.MENU_ITEMS);
    if (cached) {
        return cached;
    }

    // Cache miss - fetch from Firestore
    console.log('🔄 Fetching menu items from Firestore...');
    const q = query(collection(db, MENU_COLLECTION), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    
    // Cache the results
    setCachedData(CACHE_KEYS.MENU_ITEMS, items);
    
    return items;
};

/**
 * Force refresh menu items (bypasses cache)
 * Use this in admin panel after updating menu
 */
export const refreshMenuItems = async (): Promise<MenuItem[]> => {
    console.log('🔄 Force refreshing menu items...');
    const q = query(collection(db, MENU_COLLECTION), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    
    // Update cache
    setCachedData(CACHE_KEYS.MENU_ITEMS, items);
    
    return items;
};

// --- Settings ---

/**
 * Get menu settings with smart caching
 * - Cached for 1 hour (settings change more frequently than menu)
 * - Reduces reads from multiple per session to 1 per hour
 */
export const getMenuSettings = async (): Promise<MenuSettings | null> => {
    // Try cache first
    const cached = getCachedData<MenuSettings>(CACHE_KEYS.SETTINGS, CACHE_TTL.SETTINGS);
    if (cached) {
        return cached;
    }

    // Cache miss - fetch from Firestore
    try {
        console.log('🔄 Fetching settings from Firestore...');
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const settings = { id: docSnap.id, ...docSnap.data() } as MenuSettings;
            // Cache the results
            setCachedData(CACHE_KEYS.SETTINGS, settings);
            return settings;
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

// --- Orders ---

/**
 * Count pending orders (not completed or cancelled)
 * Used for calculating kitchen capacity and preparation times
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
 * Calculate expected preparation time based on number of pending orders
 * First order: 30 minutes
 * Each additional order: +10 minutes
 */
export const calculatePreparationTime = (pendingOrdersCount: number): number => {
    return 30 + (pendingOrdersCount * 10);
};

/**
 * Place a new order with automatic preparation time calculation
 * Returns the order document reference and the expected preparation time
 */
export const placeOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status' | 'expectedPreparationTime'>) => {
    // Count current pending orders to calculate preparation time
    const pendingCount = await getPendingOrdersCount();
    const prepTime = calculatePreparationTime(pendingCount);
    
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...order,
        status: 'pending',
        expectedPreparationTime: prepTime,
        createdAt: Timestamp.now()
    });
    
    return { docRef, expectedPreparationTime: prepTime };
};


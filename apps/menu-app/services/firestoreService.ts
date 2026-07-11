import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { MenuItem, MenuSettings, LocationSection } from '../src/types';
import { getCachedData, setCachedData, invalidateCache, CACHE_KEYS, CACHE_TTL } from '@seashell/config/cacheUtils';

// Collection References
const MENU_COLLECTION = 'menu_items';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global_settings';
const SECTIONS_COLLECTION = 'sections';

// --- Sections ---

export const getSections = async (): Promise<LocationSection[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, SECTIONS_COLLECTION));
        return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as LocationSection));
    } catch (error) {
        console.error("Error fetching sections: ", error);
        return [];
    }
};

// --- Menu Items ---

/**
 * Get available menu items with smart caching and version-based cache busting
 * - Checks global settings for the last update timestamp
 * - If Firestore has a newer update than local cache, it refreshes the menu
 * - Otherwise, uses local cache to save 50+ reads per user
 */
export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
    try {
        // 1. Fetch current settings from Firestore (1 read)
        // We bypass the cache for settings here to get the latest version tag
        const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
        const settingsSnap = await getDoc(settingsRef);
        const firestoreSettings = settingsSnap.exists() ? settingsSnap.data() as MenuSettings : null;
        
        const firestoreVersion = firestoreSettings?.lastMenuUpdate || 0;

        // 2. Check local cache
        const cachedItems = getCachedData<MenuItem[]>(CACHE_KEYS.MENU_ITEMS, CACHE_TTL.MENU_ITEMS);
        const cachedSettings = getCachedData<MenuSettings>(CACHE_KEYS.SETTINGS, CACHE_TTL.SETTINGS);
        const cachedVersion = cachedSettings?.lastMenuUpdate || 0;

        // 3. Decision: Use cache only if versions match and cache exists
        if (cachedItems && firestoreVersion === cachedVersion) {
            console.log('✅ Cache Hit (Version Match): Using local menu data.');
            return cachedItems;
        }

        // 4. Cache Miss / Version Mismatch - Fetch from Firestore
        console.log(`🔄 Cache Busted (V:${firestoreVersion} vs local:${cachedVersion}). Fetching fresh menu...`);
        const q = query(collection(db, MENU_COLLECTION), where('isAvailable', '==', true));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        
        // 5. Update local cache with new items AND new version tag
        setCachedData(CACHE_KEYS.MENU_ITEMS, items);
        if (firestoreSettings) {
            setCachedData(CACHE_KEYS.SETTINGS, firestoreSettings);
        }
        
        return items;
    } catch (error) {
        console.error("Error in versioned menu fetch:", error);
        // Fail-safe: try to return whatever is in cache
        return getCachedData<MenuItem[]>(CACHE_KEYS.MENU_ITEMS, CACHE_TTL.MENU_ITEMS) || [];
    }
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

// --- Real-time Menu Update Subscription ---

/**
 * Subscribe to menu update notifications via the settings document.
 * Listens to ONLY settings/global_settings (1 doc). Firestore bills snapshot
 * listeners only when the document changes, making this extremely cost-effective.
 * 
 * When lastMenuUpdate changes, cache is invalidated and onUpdate callback fires.
 */
export const subscribeToMenuUpdates = (
    onUpdate: () => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    let lastKnownVersion: number | null = null;

    return onSnapshot(
        settingsRef,
        (snapshot) => {
            if (!snapshot.exists()) return;
            const settings = snapshot.data() as MenuSettings;
            const currentVersion = settings.lastMenuUpdate || 0;

            // First attachment: just record version, don't trigger
            if (lastKnownVersion === null) {
                lastKnownVersion = currentVersion;
                return;
            }

            // Genuine update detected
            if (currentVersion !== lastKnownVersion) {
                console.log(`🔔 Menu update detected (v${lastKnownVersion} → v${currentVersion}). Invalidating cache...`);
                invalidateCache(CACHE_KEYS.MENU_ITEMS);
                invalidateCache(CACHE_KEYS.SETTINGS);
                lastKnownVersion = currentVersion;
                onUpdate();
            }
        },
        (error) => {
            console.error("Menu update subscription error:", error);
            onError?.(error);
        }
    );
};

// --- Orders ---

/**
 * Count pending orders (not completed or cancelled)
 * Used for calculating kitchen capacity and preparation times
 */
export const getPendingOrdersCount = async (): Promise<number> => {
    // Guests do not have Firestore permission to read the global orders collection.
    // To implement dynamic prep times in the future, a Cloud Function or admin backend
    // should routinely aggregate this count and save it to the public `settings` document.
    // For now, we return 0 to default to the baseline preparation time without throwing errors.
    return 0;
};

/**
 * Calculate expected preparation time based on number of pending orders
 * First order: 30 minutes
 * Each additional order: +10 minutes
 */
export const calculatePreparationTime = (pendingOrdersCount: number): number => {
    return 30 + (pendingOrdersCount * 10);
};


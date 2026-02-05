/**
 * Smart Caching Layer for Firestore Data
 * 
 * Reduces Firebase reads by caching static/semi-static data in localStorage
 * with configurable TTL (Time To Live)
 * 
 * Expected Impact: 90%+ reduction in Firestore reads
 */

// Cache keys for different data types
export const CACHE_KEYS = {
  MENU_ITEMS: 'seashell_menu_items_v1',
  SETTINGS: 'seashell_settings_v1',
} as const;

// Time To Live (TTL) for different cache types
export const CACHE_TTL = {
  MENU_ITEMS: 24 * 60 * 60 * 1000, // 24 hours (menu rarely changes)
  SETTINGS: 60 * 60 * 1000, // 1 hour (settings may change more frequently)
} as const;

interface CacheData<T> {
  data: T;
  timestamp: number;
  version: string; // For cache invalidation on app updates
}

const CACHE_VERSION = '1.0.0'; // Increment to invalidate all caches

/**
 * Get data from cache if valid, otherwise return null
 */
export const getCachedData = <T>(key: string, ttl: number): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      console.log(`📦 Cache miss: ${key} not found`);
      return null;
    }

    const parsed = JSON.parse(cached) as CacheData<T>;
    
    // Check version mismatch (app update)
    if (parsed.version !== CACHE_VERSION) {
      console.log(`📦 Cache invalidated: ${key} version mismatch`);
      localStorage.removeItem(key);
      return null;
    }

    // Check expiration
    const age = Date.now() - parsed.timestamp;
    if (age > ttl) {
      console.log(`📦 Cache expired: ${key} (age: ${Math.round(age / 1000 / 60)}min, TTL: ${Math.round(ttl / 1000 / 60)}min)`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000 / 60)}min)`);
    return parsed.data;
  } catch (error) {
    console.warn(`⚠️ Cache read error for ${key}:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Store data in cache with timestamp and version
 */
export const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`💾 Cached: ${key}`);
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn(`⚠️ Failed to cache ${key}:`, error);
    
    // If quota exceeded, try clearing old caches
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearAllCaches();
      // Retry once
      try {
        const cacheData: CacheData<T> = {
          data,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
        console.log(`💾 Cached after cleanup: ${key}`);
      } catch {
        console.error(`❌ Still couldn't cache ${key} after cleanup`);
      }
    }
  }
};

/**
 * Invalidate a specific cache entry
 */
export const invalidateCache = (key: string): void => {
  localStorage.removeItem(key);
  console.log(`🗑️ Invalidated cache: ${key}`);
};

/**
 * Clear all Seashell caches
 */
export const clearAllCaches = (): void => {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('🗑️ Cleared all caches');
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = () => {
  const stats: Record<string, { exists: boolean; age?: number; size?: number }> = {};
  
  Object.entries(CACHE_KEYS).forEach(([name, key]) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as CacheData<unknown>;
        stats[name] = {
          exists: true,
          age: Date.now() - parsed.timestamp,
          size: new Blob([cached]).size,
        };
      } else {
        stats[name] = { exists: false };
      }
    } catch {
      stats[name] = { exists: false };
    }
  });
  
  return stats;
};

/**
 * Hook for React components to manually refresh cache
 * Use this in admin panel to force menu refresh
 */
export const useInvalidateCache = () => {
  return {
    invalidateMenuCache: () => {
      invalidateCache(CACHE_KEYS.MENU_ITEMS);
      invalidateCache(CACHE_KEYS.SETTINGS);
    },
    clearAllCaches,
    getCacheStats,
  };
};

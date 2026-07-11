 import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Order, OrderItem } from '../src/types';

const ORDER_HISTORY_COLLECTION = 'order_history';
const ORDERS_COLLECTION = 'orders';
const MENU_COLLECTION = 'menu_items';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getOrderTime = (order: any): number => {
    const c = order.createdAt;
    if (!c) return 0;
    if (typeof c === 'object' && 'seconds' in c) return c.seconds * 1000;
    if (typeof c === 'number') return c;
    return 0;
};

const getItemName = (item: any): string => {
    if (!item || !item.name) return '';
    if (typeof item.name === 'object' && 'en' in item.name) return item.name.en || '';
    return String(item.name);
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    topCategory: string;

    revenueOverTime: { date: string; revenue: number }[];
    categoryBreakdown: { category: string; count: number; revenue: number; pct: number }[];
    topMeals: { name: string; count: number; revenue: number; category: string }[];
    outletDistribution: { outlet: string; orders: number; revenue: number }[];
    topMealsOfDay: { name: string; category: string; count: number; revenue: number; outlet: string; image?: string }[];
    topCategoriesList: string[];
}

// ─── Main fetch ───────────────────────────────────────────────────────────────
export const fetchAnalytics = async (
    startDate: Date,
    endDate: Date,
    menuSource: 'all' | 'presto' | 'room-service' | 'seashell' = 'all'
): Promise<AnalyticsData> => {
    const startMs = startDate.getTime();
    const endMs = new Date(endDate).setHours(23, 59, 59, 999);

    // Fetch both active and archived orders, AND the live menu to resolve categories
    const [historySnap, activeSnap, menuSnap] = await Promise.all([
        getDocs(query(collection(db, ORDER_HISTORY_COLLECTION), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, MENU_COLLECTION))
    ]);

    // Build a category map from the live menu
    // We map both by itemId and by lowercase name as a fallback
    const categoryMap = new Map<string, string>();
    const imageMap = new Map<string, string>();
    menuSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
            categoryMap.set(doc.id, data.category);
            
            const img = data.imageUrl || data.image || (data.images && data.images.length > 0 ? data.images[0] : null);
            if (img) imageMap.set(doc.id, img);
            
            // Name fallback
            let enName = '';
            if (typeof data.name === 'object' && data.name.en) enName = data.name.en;
            else if (typeof data.name === 'string') enName = data.name;
            
            if (enName) {
                categoryMap.set(enName.toLowerCase(), data.category);
                if (img) imageMap.set(enName.toLowerCase(), img);
            }
        }
    });

    // Helper to resolve an order item's image
    const resolveImage = (item: any): string | null => {
        const itemImg = item.imageUrl || item.image || (item.images && item.images.length > 0 ? item.images[0] : null);
        if (itemImg) return itemImg;
        if (item.itemId && imageMap.has(item.itemId)) return imageMap.get(item.itemId)!;
        const name = getItemName(item).toLowerCase();
        if (name && imageMap.has(name)) return imageMap.get(name)!;
        return null;
    };

    // Helper to resolve an order item's category
    const resolveCategory = (item: any): string | null => {
        // 1. If it's saved directly on the order item (legacy or future proof)
        if (item.category && item.category !== 'undefined') return item.category.trim();
        
        // 2. Try matching by itemId to the live menu
        if (item.itemId && categoryMap.has(item.itemId)) {
            return categoryMap.get(item.itemId)!;
        }

        // 3. Try matching by name to the live menu
        const name = getItemName(item).toLowerCase();
        if (categoryMap.has(name)) {
            return categoryMap.get(name)!;
        }

        return null; // Truly uncategorised
    };

    const allRaw = [...historySnap.docs, ...activeSnap.docs];

    // Parse, apply date range filter, apply menu source filter
    const orders: Order[] = allRaw
        .map(d => ({ id: d.id, ...d.data() } as Order))
        .filter(o => {
            const t = getOrderTime(o);
            if (t < startMs || t > endMs) return false;
            if (menuSource !== 'all') {
                if (menuSource === 'room-service') return !o.menu || o.menu === 'room-service';
                return o.menu === menuSource;
            }
            return true;
        });

    const completedOrders = orders.filter(o =>
        o.status === 'completed' || o.status === 'delivered'
    );

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const totalRevenue = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalOrders = completedOrders.length;
    const uniqueCustomers = new Set(
        completedOrders.map(o => o.guestId || o.phoneNumber || o.roomNumber || o.id)
    ).size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // ── Revenue Over Time ─────────────────────────────────────────────────────
    const revenueByDay = new Map<string, number>();
    completedOrders.forEach(o => {
        const d = new Date(getOrderTime(o));
        const key = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
        revenueByDay.set(key, (revenueByDay.get(key) || 0) + (o.totalAmount || 0));
    });
    const revenueOverTime = Array.from(revenueByDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({ date, revenue }));

    // ── Category Breakdown ────────────────────────────────────────────────────
    const catMap = new Map<string, { count: number; revenue: number }>();
    completedOrders.forEach(o => {
        o.items.forEach((item: any) => {
            const cat = resolveCategory(item);
            if (!cat) return; // skip truly uncategorised
            const itemRevenue = (item.effectiveTotal ?? item.price * item.quantity) || 0;
            const prev = catMap.get(cat) || { count: 0, revenue: 0 };
            catMap.set(cat, { count: prev.count + item.quantity, revenue: prev.revenue + itemRevenue });
        });
    });

    const totalCategorisedItems = Array.from(catMap.values()).reduce((s, v) => s + v.count, 0);
    const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, v]) => ({
            category,
            count: v.count,
            revenue: v.revenue,
            pct: totalCategorisedItems > 0 ? Math.round((v.count / totalCategorisedItems) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

    const topCategory = categoryBreakdown[0]?.category || '—';
    const topCategoriesList = categoryBreakdown.slice(0, 5).map(c => c.category);

    // ── Top Meals ─────────────────────────────────────────────────────────────
    const mealMap = new Map<string, { count: number; revenue: number; category: string }>();
    completedOrders.forEach(o => {
        o.items.forEach((item: any) => {
            const name = getItemName(item);
            const cat = resolveCategory(item) || 'Uncategorised';
            const rev = (item.effectiveTotal ?? item.price * item.quantity) || 0;
            const prev = mealMap.get(name) || { count: 0, revenue: 0, category: cat };
            mealMap.set(name, { count: prev.count + item.quantity, revenue: prev.revenue + rev, category: cat });
        });
    });
    const topMeals = Array.from(mealMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // ── Outlet Distribution ───────────────────────────────────────────────────
    const outletMap = new Map<string, { orders: number; revenue: number }>();
    completedOrders.forEach(o => {
        const outlet = o.menu === 'presto' ? 'Presto' :
                       o.menu === 'seashell' ? 'Seashell' : 'Room Service';
        const prev = outletMap.get(outlet) || { orders: 0, revenue: 0 };
        outletMap.set(outlet, { orders: prev.orders + 1, revenue: prev.revenue + (o.totalAmount || 0) });
    });
    const outletDistribution = ['Seashell', 'Room Service', 'Presto'].map(outlet => ({
        outlet,
        orders: outletMap.get(outlet)?.orders || 0,
        revenue: outletMap.get(outlet)?.revenue || 0,
    }));

    // ── Top Meals of the Day ─────────────────────────────────────────────────
    const topMealsOfDay = Array.from(mealMap.entries())
        .map(([name, v]) => {
            const matchingOrder = completedOrders.find(o =>
                o.items.some((i: any) => getItemName(i) === name)
            );
            const outlet = matchingOrder?.menu === 'presto' ? 'Presto' :
                           matchingOrder?.menu === 'seashell' ? 'Seashell' : 'Room Service';
                           
            const matchingItem = matchingOrder?.items.find((i: any) => getItemName(i) === name);
            const image = matchingItem ? resolveImage(matchingItem) || undefined : undefined;
            return { name, ...v, outlet, image };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    return {
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        avgOrderValue,
        topCategory,
        revenueOverTime,
        categoryBreakdown,
        topMeals,
        outletDistribution,
        topMealsOfDay,
        topCategoriesList,
    };
};

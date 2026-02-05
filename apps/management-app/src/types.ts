// Import shared category definitions
import { Category, getCategoriesByMenu, ROOM_SERVICE_CATEGORIES, PRESTO_CATEGORIES, CATEGORY_NAMES } from './menuCategories';

// Re-export for convenience
export type { Category };
export { getCategoriesByMenu, ROOM_SERVICE_CATEGORIES, PRESTO_CATEGORIES, CATEGORY_NAMES };

export interface Theme {
    textColor: string;
    accentColor: string;
}

export interface LocalizedString {
    en: string;
    ar: string;
}

export interface CategoryData {
    id: string;
    name: LocalizedString;
    image: string;
    images: string[]; // Dynamic images
    video: string;
    theme: Theme;
    items: MenuItem[];
}

export interface MenuItem {
    id?: string;
    name: string | { en: string; ar: string };
    description: string | { en: string; ar: string };
    price: number;
    category: Category;
    menuType: 'All Day' | 'Breakfast' | 'Lunch' | 'Dinner';
    menu?: 'presto' | 'room-service'; // Which menu this item belongs to
    isAvailable: boolean;
    imageUrl?: string;
    image?: string; // For backward compatibility
    images?: string[]; // Support for multiple images
    createdAt?: number;

    // New fields for Multi-Menu & Customization
    season?: 'Summer' | 'Winter';
    sizes?: { name: string; price: number }[];
    addons?: { name: string; price: number }[];
    note?: string; // e.g. "Served with cream"
    tags?: ('spicy' | 'vegetarian' | 'nuts' | 'traditional')[]; // Dietary/special indicators

    // === DISCOUNT FIELDS (Optional - backward compatible) ===

    // Item-level discount: Show discounted price with label
    discountPrice?: number;           // The new discounted price (e.g., 2.500 instead of 3.500)
    discountLabel?: string;           // Label shown on item (e.g., "Winter Special!", "Happy Hour")

    // Bundle pricing: Quantity-based discounts (e.g., "3 for 8.750 KD")
    bundlePricing?: {
        quantity: number;             // Number of items needed (e.g., 3)
        price: number;                // Bundle price (e.g., 8.750)
        label?: string;               // Optional label (e.g., "Family Deal")
    }[];
}

export interface OrderItem {
    itemId: string;
    name: string | { en: string; ar: string };
    quantity: number;
    price: number;

    // New fields for Order Customization
    selectedSize?: string;
    selectedAddons?: string[];
    specialInstructions?: string;

    // Pricing fields for discounts and bundles
    unitPrice?: number;           // Price per item (after size/addons)
    effectiveTotal?: number;      // Final price for this line (after discounts/bundles)
    originalTotal?: number;       // What it would cost without discounts
    savings?: number;             // Amount saved
    appliedBundle?: {
        quantity: number;
        price: number;
        label?: string;
    };
    hasDiscount?: boolean;
    hasBundlePricing?: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed';

export interface Order {
    id: string;
    roomNumber: string;
    guestName?: string;
    guestId?: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod?: 'cash' | 'card' | 'room-charge' | 'hesabe';
    createdAt: number;
    items: OrderItem[];
    chairNumber?: string; // For Beach Guests
    phoneNumber?: string;
    menu?: 'presto' | 'room-service'; // Which menu this order was placed from
    expectedPreparationTime?: number; // Estimated preparation time in minutes shown to guest
    isVIP?: boolean; // VIP status - manager can tag important orders
    notes?: string; // Special notes for the order
}

export interface Guest {
    id?: string;
    name: string;
    roomNumber: string;
    phoneNumber: string;
    isActive: boolean;
    checkInDate: any;
    checkOutDate: any;
}

export interface User {
    username: string;
    role: 'admin' | 'kitchen';
}

export interface MenuSettings {
    id: string; // 'global_settings'
    activeSeason: 'Summer' | 'Winter';
    activeMenu: 'presto' | 'room-service'; // Which menu is currently active for guests
    menuOpen?: boolean; // Whether the menu is accepting orders (kitchen capacity management)
    closeMessage?: string; // Custom close message (English) - UI wrapper is bilingual
}

export type Language = 'en' | 'ar';
export type ViewState = 'HOME' | 'CART' | 'CONFIRMATION' | 'ORDER_TRACKING';

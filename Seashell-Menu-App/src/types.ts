export type Category =
    | 'Breakfast'
    | 'Hot Beverages'
    | 'Cold Beverages'
    | 'Frappes'
    | 'Smoothies'
    | 'Milkshakes'
    | 'Fresh Juices'
    | 'Cocktails'
    | 'Malt Beverages'
    | 'Refreshing Drinks'
    | 'Appetizers'
    | 'Italian Pasta'
    | 'Soups'
    | 'Salads'
    | 'Risotto'
    | 'Pizzeria Chez Nous'
    | 'Main Course'
    | 'Sweets and Fruits';

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
}

export type Language = 'en' | 'ar';
export type ViewState = 'HOME' | 'CART' | 'CONFIRMATION' | 'ORDER_TRACKING';

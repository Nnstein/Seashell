export type Category =
    | 'Bedroom'
    | 'Bathroom'
    | 'Kitchen'
    | 'Living Room'
    | 'General';

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
    images: string[];
    video: string;
    theme: Theme;
    items: HousekeepingItem[];
}

export interface HousekeepingItem {
    id: string;
    name: string | { en: string; ar: string };
    description: string | { en: string; ar: string };
    category: Category;
    imageUrl?: string;
    image?: string;
    images?: string[];
    isAvailable: boolean;
}

export interface RequestItem {
    itemId: string;
    name: string | { en: string; ar: string };
    quantity: number;
}

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
    id: string;
    roomNumber: string;
    guestName?: string;
    status: RequestStatus;
    createdAt: number;
    items: RequestItem[];
    type: 'items' | 'service'; // 'items' for towels etc, 'service' for cleaning etc
    serviceType?: string; // e.g. "Room Cleaning", "Laundry"
}

export type Language = 'en' | 'ar';
export type ViewState = 'HOME' | 'REQUEST_CONFIRMATION' | 'TRACKING';

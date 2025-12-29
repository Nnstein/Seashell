export type Category =
    | 'Bedroom'
    | 'Bathroom'
    | 'Kitchen'
    | 'Living Room'
    | 'General';

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
    type: 'items' | 'service';
    serviceType?: string;
}

export type Language = 'en' | 'ar';

/**
 * Guest Service
 * Handles guest-facing API calls to the backend.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

import { GuestOrderHistoryItem } from '../src/types';

export interface GuestOrderHistoryResponse {
    success: boolean;
    count: number;
    orders: GuestOrderHistoryItem[];
}

/**
 * Fetch the guest's order history from the backend.
 * Queries both active orders and archived order_history, limited to last 6 months.
 */
export const fetchGuestOrderHistory = async (
    roomNumber: string,
    phoneNumber: string
): Promise<GuestOrderHistoryResponse> => {
    try {
        const params = new URLSearchParams({
            roomNumber: roomNumber.trim(),
            phoneNumber: phoneNumber.trim()
        });

        const response = await fetch(`${BACKEND_URL}/guest/orders?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch order history: ${response.statusText}`);
        }

        const data: GuestOrderHistoryResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Guest order history fetch error:', error);
        return {
            success: false,
            count: 0,
            orders: []
        };
    }
};

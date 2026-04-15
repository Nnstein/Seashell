/**
 * Payment Service - Hesabe Integration
 * Handles payment processing through the Hesabe backend
 */

// Backend URL - adjust based on your setup
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface CreateCheckoutRequest {
    amount: number;
    orderReferenceNumber?: string;
    variable1?: string; // room number
    variable2?: string; // phone number
    variable3?: string; // guest name
    variable4?: string; // chair number (beach guests)
    variable5?: string; // menu type
}

export interface CheckoutResponse {
    success: boolean;
    redirectUrl?: string;
    token?: string;
    error?: string;
    response?: any;
}

/**
 * Create a Hesabe checkout session and get redirect URL
 */
export const createHesabeCheckout = async (request: CreateCheckoutRequest): Promise<CheckoutResponse> => {
    try {
        const response = await fetch(`${BACKEND_URL}/payment/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: request.amount.toFixed(3), // Ensure 3 decimal places for KWD
                orderReferenceNumber: request.orderReferenceNumber,
                variable1: request.variable1 || '',
                variable2: request.variable2 || '',
                variable3: request.variable3 || '',
                variable4: request.variable4 || '',
                variable5: request.variable5 || '',
            })
        });

        if (!response.ok) {
            throw new Error(`Checkout failed: ${response.statusText}`);
        }

        const data: CheckoutResponse = await response.json();
        
        return data;
    } catch (error) {
        console.error('Hesabe checkout error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create checkout'
        };
    }
};

/**
 * Test backend connection
 */
export const testBackendConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Backend connection test failed:', error);
        return false;
    }
};

/**
 * Get backend configuration (for debugging)
 */
export const getBackendConfig = async () => {
    try {
        const response = await fetch(`${BACKEND_URL}/payment/test`);
        return await response.json();
    } catch (error) {
        console.error('Failed to get backend config:', error);
        return null;
    }
};

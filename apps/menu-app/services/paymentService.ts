/**
 * Payment Service - Hesabe Integration
 * Handles payment processing through the Hesabe backend
 */

// Backend URL - adjust based on your setup
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface OrderItemRequest {
    itemId: string;
    quantity: number;
    notes?: string;
    selectedSize?: string;
    selectedAddons?: string[];
    // Pricing info for verification and display
    name?: string | { en: string; ar: string };
    price?: number;
    unitPrice?: number;
    effectiveTotal?: number;
    hasBundlePricing?: boolean;
    appliedBundle?: any;
}

export interface CreateCheckoutRequest {
    amount?: number; // Optional as backend calculates it from items
    orderReferenceNumber?: string;
    variable1?: string; // room number
    variable2?: string; // phone number
    variable3?: string; // guest name
    variable4?: string; // chair number (beach guests)
    variable5?: string; // menu type
    items: OrderItemRequest[];
    paymentType?: number; // 0=All (Indirect), 1=KNET (Direct), 2=MPGS (Direct Visa/Master), 9=ApplePay
}

export interface CheckoutResponse {
    success: boolean;
    redirectUrl?: string;
    token?: string;
    error?: string;
    message?: string;
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
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({
                // amount is calculated server-side now, but we can send a hint if needed
                amount: request.amount ? request.amount.toFixed(3) : undefined,
                orderReferenceNumber: request.orderReferenceNumber,
                variable1: request.variable1 || '',
                variable2: request.variable2 || '',
                variable3: request.variable3 || '',
                variable4: request.variable4 || '',
                variable5: request.variable5 || '',
                items: request.items,
                paymentType: request.paymentType ?? 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Surface specific item-unavailable errors so the guest can take action
            if (errorData.error === 'TIME_CONSTRAINT') {
                throw new Error(`TIME_CONSTRAINT: ${errorData.message || 'Time constraint violated.'}`);
            }
            if (errorData.error === 'ITEM_UNAVAILABLE') {
                throw new Error(`ITEM_UNAVAILABLE: ${errorData.message || 'One of your items is no longer available. Please review your order.'}`);
            }
            throw new Error(errorData.error || `Checkout failed: ${response.statusText}`);
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
        const response = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
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
        const response = await fetch(`${BACKEND_URL}/payment/test`, { signal: AbortSignal.timeout(10000) });
        return await response.json();
    } catch (error) {
        console.error('Failed to get backend config:', error);
        return null;
    }
};

/**
 * Verify a Hesabe payment by sending the encrypted ?data= param to the backend.
 * Used in the Indirect integration flow where Hesabe redirects the browser directly
 * to the frontend with ?data=<encrypted_token>.
 */
export const verifyHesabePayment = async (encryptedData: string): Promise<{
    success: boolean;
    orderRef?: string;
    resultCode?: string;
    message?: string;
    error?: string;
}> => {
    try {
        const response = await fetch(`${BACKEND_URL}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({ data: encryptedData })
        });
        return await response.json();
    } catch (error) {
        console.error('Payment verify error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
};

import { useState, useCallback } from 'react';
import { createHesabeCheckout, testBackendConnection } from '../services/paymentService';
import { CartItem } from './useCart';
import { ViewState } from '../src/types';

interface UseOrderProps {
    cart: CartItem[];
    clearCart: () => void;
    roomNumber: string;
    phoneNumber: string;
    chairNumber: string;
    isBeachGuest: boolean;
    activeMenu: 'presto' | 'room-service' | 'seashell';
    setView: (view: ViewState) => void;
    setIsCartOpen: (isOpen: boolean) => void;
    // Toast callbacks (optional for backward compatibility)
    showError?: (message: string) => void;
    showWarning?: (message: string) => void;
    showInfo?: (message: string) => void;
}

export const useOrder = ({
    cart,
    clearCart,
    roomNumber,
    phoneNumber,
    chairNumber,
    isBeachGuest,
    activeMenu,
    setView,
    setIsCartOpen,
    showError,
    showWarning,
    showInfo
}: UseOrderProps) => {
    const [confirmedOrder, setConfirmedOrder] = useState<CartItem[]>([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Helper to show messages (uses toast if available, falls back to alert)
    const notify = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'info') => {
        if (type === 'error' && showError) {
            showError(message);
        } else if (type === 'warning' && showWarning) {
            showWarning(message);
        } else if (type === 'info' && showInfo) {
            showInfo(message);
        } else {
            // Fallback to alert if toast not available
            alert(message);
        }
    }, [showError, showWarning, showInfo]);

    const handleCheckout = useCallback(async (paymentType: number = 0) => {
        if (cart.length === 0) return;

        // Validate required fields
        if (!roomNumber) {
            notify("Please enter your room number.\nيرجى إدخال رقم غرفتك.", 'warning');
            return;
        }

        if (!phoneNumber) {
            notify("Please enter your phone number.\nيرجى إدخال رقم هاتفك.", 'warning');
            return;
        }



        if (isPlacingOrder) return;

        setIsPlacingOrder(true);

        try {
            notify("Connecting to secure payment server...\nجاري الاتصال بخادم الدفع الآمن...", 'info');
            const isBackendAlive = await testBackendConnection();
            if (!isBackendAlive) {
                throw new Error("Secure payment server is temporarily busy. Please wait a moment and try again.\nخادم الدفع الآمن مشغول مؤقتًا. يرجى الانتظار لحظة والمحاولة مرة أخرى.");
            }

            // NOTE: amount is calculated server-side now for security.
            // We just pass it here for the UI/Redirect logic if needed.
            const totalAmount = cart.reduce((sum, item) =>
                sum + (item.effectiveTotal ?? item.price * item.quantity), 0
            );

            // Handle card payment through Hesabe (The ONLY accepted method)
            const orderRef = `ORDER-${Date.now()}`;
            
            notify("Redirecting to payment gateway...\nجاري إعادة التوجيه إلى بوابة الدفع...", 'info');
            
            // Map items with full info for server-side verification and management display
            const orderItems = cart.map(item => ({
                itemId: item.id || 'unknown',
                name: item.name,
                price: item.price,
                unitPrice: item.unitPrice ?? item.price,
                effectiveTotal: item.effectiveTotal,
                quantity: item.quantity,
                notes: item.specialInstructions || '',
                ...(item.hasBundlePricing ? { hasBundlePricing: item.hasBundlePricing } : {}),
                ...(item.appliedBundle ? { appliedBundle: item.appliedBundle } : {}),
                // Include selection info for price verification
                ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
                ...(item.selectedAddons ? { selectedAddons: item.selectedAddons } : {})
            }));

            // Create Hesabe checkout AND Firestore Order (Secure Handshake)
            const checkoutResult = await createHesabeCheckout({
                orderReferenceNumber: orderRef,
                variable1: roomNumber,
                variable2: phoneNumber,
                variable3: 'Guest',
                variable4: isBeachGuest ? chairNumber : '',
                variable5: activeMenu,
                items: orderItems,
                paymentType: paymentType
            });

            if (!checkoutResult.success || !checkoutResult.redirectUrl) {
                if (checkoutResult.error === 'MENU_CLOSED') {
                    throw new Error(`MENU_CLOSED:${checkoutResult.message}`);
                }
                throw new Error(checkoutResult.error || 'Failed to create payment checkout');
            }

            // Save snapshot to localStorage for post-payment recovery/display
            localStorage.setItem('pending_order', JSON.stringify({
                orderReference: orderRef,
                roomNumber,
                phoneNumber,
                guestName: 'Guest',
                totalAmount,
                paymentMethod: 'card',
                items: orderItems,
                menu: activeMenu,
                ...(isBeachGuest && chairNumber ? { chairNumber } : {}),
                cart: cart, // For confirmation page display
                timestamp: Date.now()
            }));

            // Redirect to Hesabe payment page
            window.location.href = checkoutResult.redirectUrl;
            return;
        } catch (error: unknown) {
            console.error("Error placing order: ", error);
            const errorMsg = error instanceof Error ? error.message : '';
            if (errorMsg.startsWith('MENU_CLOSED:')) {
                const message = errorMsg.replace('MENU_CLOSED:', '').trim();
                notify(message, 'warning');
            } else if (errorMsg.startsWith('TIME_CONSTRAINT:')) {
                const message = errorMsg.replace('TIME_CONSTRAINT:', '').trim();
                notify(`${message}\nPlease remove this item from your cart to proceed.\nيرجى إزالة هذا العنصر من سلة التسوق للمتابعة.`, 'error');
            } else if (errorMsg.startsWith('ITEM_UNAVAILABLE:')) {
                // A menu item was removed between cart-add and checkout
                const itemName = errorMsg.replace('ITEM_UNAVAILABLE:', '').trim();
                notify(`Item ${itemName} is no longer available and has been removed from your cart. Please select an alternative.\nالعنصر ${itemName} لم يعد متاحًا وتمت إزالته من سلة التسوق الخاصة بك. يرجى اختيار بديل.`, 'error');
            } else {
                notify("Unable to place your order. Please try again or call reception.\nتعذر إتمام طلبك. يرجى المحاولة مرة أخرى أو الاتصال بمكتب الاستقبال.", 'error');
            }
        } finally {
            setIsPlacingOrder(false);
        }
    }, [cart, roomNumber, phoneNumber, chairNumber, isBeachGuest, activeMenu, isPlacingOrder, clearCart, setView, setIsCartOpen, notify]);

    const resetOrder = useCallback(() => {
        clearCart();
        setConfirmedOrder([]);
        setView('MENU');
    }, [clearCart, setView]);

    return {
        confirmedOrder,
        isPlacingOrder,
        handleCheckout,
        resetOrder
    };
};

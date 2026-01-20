import { useState, useCallback } from 'react';
import { placeOrder } from '../services/firestoreService';
import { CartItem } from './useCart';
import { ViewState } from '../src/types';

interface UseOrderProps {
    cart: CartItem[];
    clearCart: () => void;
    roomNumber: string;
    phoneNumber: string;
    chairNumber: string;
    isBeachGuest: boolean;
    activeMenu: 'presto' | 'room-service';
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

    const handleCheckout = useCallback(async (paymentMethod: 'room-charge' | 'card' | 'hesabe') => {
        if (cart.length === 0) return;

        if (paymentMethod === 'hesabe') {
            notify("Hesabe Payment Gateway integration coming soon!", 'info');
            return;
        }

        if (!roomNumber) {
            notify("Please enter your room number.", 'warning');
            return;
        }

        if (!phoneNumber) {
            notify("Please enter your phone number.", 'warning');
            return;
        }

        if (isBeachGuest && !chairNumber) {
            notify("Please enter your Chair/Table Number.", 'warning');
            return;
        }

        if (isPlacingOrder) return;

        setIsPlacingOrder(true);

        try {
            // Include full pricing info for each item
            // IMPORTANT: Firestore doesn't accept undefined values, so we only include defined fields
            const orderItems = cart.map(item => {
                const orderItem: Record<string, any> = {
                    itemId: item.id || 'unknown',
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.specialInstructions || '',
                    // Include pricing details for discounts/bundles
                    unitPrice: item.unitPrice ?? item.price,
                    effectiveTotal: item.effectiveTotal ?? (item.price * item.quantity),
                    originalTotal: item.originalTotal ?? (item.price * item.quantity),
                    savings: item.savings ?? 0,
                    hasDiscount: item.hasDiscount ?? false,
                    hasBundlePricing: item.hasBundlePricing ?? false
                };

                // Only add optional fields if they have values (Firestore rejects undefined)
                if (item.appliedBundle) {
                    orderItem.appliedBundle = item.appliedBundle;
                }
                if (item.selectedSize) {
                    orderItem.selectedSize = item.selectedSize;
                }
                if (item.selectedAddons && item.selectedAddons.length > 0) {
                    orderItem.selectedAddons = item.selectedAddons;
                }
                if (item.specialInstructions) {
                    orderItem.specialInstructions = item.specialInstructions;
                }

                return orderItem;
            });

            // Calculate total using effective totals (includes discounts/bundles)
            const totalAmount = cart.reduce((sum, item) =>
                sum + (item.effectiveTotal ?? item.price * item.quantity), 0
            );

            await placeOrder({
                roomNumber,
                phoneNumber,
                guestName: 'Guest',
                totalAmount,
                paymentMethod,
                items: orderItems as any,
                menu: activeMenu,
                ...(isBeachGuest && chairNumber ? { chairNumber } : {})
            });

            setConfirmedOrder([...cart]);
            setView('CONFIRMATION');
            setIsCartOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            clearCart();
        } catch (error: unknown) {
            console.error("Error placing order: ", error);
            notify("Unable to place your order. Please try again or contact reception.", 'error');
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

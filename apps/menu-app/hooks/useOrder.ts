import { useState, useCallback } from 'react';
import { placeOrder } from '../services/firestoreService';
import { createHesabeCheckout } from '../services/paymentService';
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
    const [expectedPreparationTime, setExpectedPreparationTime] = useState<number>(30);

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

    const handleCheckout = useCallback(async (paymentMethod: 'room_charge' | 'card') => {
        if (cart.length === 0) return;

        // Validate required fields
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
            // Calculate total using effective totals (includes discounts/bundles)
            const totalAmount = cart.reduce((sum, item) =>
                sum + (item.effectiveTotal ?? item.price * item.quantity), 0
            );

            // Handle card payment through Hesabe
            if (paymentMethod === 'card') {
                const orderRef = `ORDER-${Date.now()}`;
                
                notify("Redirecting to payment gateway...", 'info');
                
                // Create Hesabe checkout
                const checkoutResult = await createHesabeCheckout({
                    amount: totalAmount,
                    orderReferenceNumber: orderRef,
                    variable1: roomNumber,
                    variable2: phoneNumber,
                    variable3: 'Guest',
                    variable4: isBeachGuest ? chairNumber : '',
                    variable5: activeMenu,
                });

                if (!checkoutResult.success || !checkoutResult.redirectUrl) {
                    throw new Error(checkoutResult.error || 'Failed to create payment checkout');
                }

                // Save order data to localStorage (to complete after payment)
                // Include full pricing info for each item
                const orderItems = cart.map(item => {
                    const orderItem: Record<string, any> = {
                        itemId: item.id || 'unknown',
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.specialInstructions || '',
                        unitPrice: item.unitPrice ?? item.price,
                        effectiveTotal: item.effectiveTotal ?? (item.price * item.quantity),
                        originalTotal: item.originalTotal ?? (item.price * item.quantity),
                        savings: item.savings ?? 0,
                        hasDiscount: item.hasDiscount ?? false,
                        hasBundlePricing: item.hasBundlePricing ?? false
                    };

                    if (item.appliedBundle) orderItem.appliedBundle = item.appliedBundle;
                    if (item.selectedSize) orderItem.selectedSize = item.selectedSize;
                    if (item.selectedAddons && item.selectedAddons.length > 0) orderItem.selectedAddons = item.selectedAddons;
                    if (item.specialInstructions) orderItem.specialInstructions = item.specialInstructions;

                    return orderItem;
                });

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
                    cart: cart, // For confirmation page
                    timestamp: Date.now()
                }));

                // Redirect to Hesabe payment page
                window.location.href = checkoutResult.redirectUrl;
                return;
            }

            // Handle room charge (existing logic)
            // Include full pricing info for each item
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

            const orderResult = await placeOrder({
                roomNumber,
                phoneNumber,
                guestName: 'Guest',
                totalAmount,
                paymentMethod: 'room-charge', // Convert to expected format
                items: orderItems as any,
                menu: activeMenu,
                ...(isBeachGuest && chairNumber ? { chairNumber } : {})
            });

            // Store the expected preparation time
            setExpectedPreparationTime(orderResult.expectedPreparationTime);

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
        resetOrder,
        expectedPreparationTime
    };
};

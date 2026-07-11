import { useState, useCallback, useEffect } from 'react';
import { MenuItem } from '../src/types';

// Define CartItem locally as it extends MenuItem with quantity and pricing info
export interface CartItem extends MenuItem {
    quantity: number;
    cartId: string;
    selectedSize?: string;
    selectedAddons?: string[];
    specialInstructions?: string;

    // Pricing fields for discounts and bundles
    unitPrice: number;            // Price per item (after size/addons, before bundle)
    effectiveTotal: number;       // Final price for this line item (after all discounts/bundles)
    originalTotal: number;        // What it would cost without discounts/bundles
    savings: number;              // Amount saved
    appliedBundle?: {             // Bundle info if applied
        quantity: number;
        price: number;
        label?: string;
    };
    hasDiscount: boolean;         // Whether item-level discount is active
    hasBundlePricing: boolean;    // Whether bundle pricing is active
}

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [animateCart, setAnimateCart] = useState(false);

    // Restore cart from pending_order only if it belongs to the current session user
    const restoreCartForSession = useCallback((sessionRoomNumber: string) => {
        const pendingOrderStr = localStorage.getItem('pending_order');
        if (!pendingOrderStr) return;
        try {
            const pendingOrder = JSON.parse(pendingOrderStr);
            // Only restore if the pending order belongs to this same guest
            const sameGuest = pendingOrder.roomNumber === sessionRoomNumber;
            if (pendingOrder.cart && sameGuest && !window.location.pathname.includes('payment-callback')) {
                const restoredCart: CartItem[] = pendingOrder.cart.map((item: any) => ({
                    ...item,
                    cartId: item.cartId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                }));
                setCart(restoredCart);
                console.log('Cart restored from pending order for room:', sessionRoomNumber);
            } else if (!sameGuest) {
                // Different guest — clear the old pending order
                localStorage.removeItem('pending_order');
                console.log('Cleared stale pending_order from previous guest');
            }
        } catch (e) {
            console.error('Failed to restore cart from pending order:', e);
        }
    }, []);

    // Helper to sync cart changes back to pending_order if it exists
    // This prevents removed items from reappearing after a refresh
    const syncToPendingOrder = useCallback((newCart: CartItem[]) => {
        const pendingOrderStr = localStorage.getItem('pending_order');
        if (!pendingOrderStr) return;

        try {
            const pendingOrder = JSON.parse(pendingOrderStr);
            if (newCart.length === 0) {
                // If cart is now empty, remove the pending order snapshot entirely
                localStorage.removeItem('pending_order');
            } else {
                // Update the snapshot with the new cart content
                pendingOrder.cart = newCart;
                
                // Update totalAmount to match current cart
                pendingOrder.totalAmount = newCart.reduce((sum, item) => sum + item.effectiveTotal, 0);
                
                // Update simplified items (used for Firestore placement in callback)
                pendingOrder.items = newCart.map(item => ({
                    itemId: item.id || 'unknown',
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.specialInstructions || '',
                    unitPrice: item.unitPrice ?? item.price,
                    effectiveTotal: item.effectiveTotal,
                    originalTotal: item.originalTotal,
                    savings: item.savings,
                    hasDiscount: item.hasDiscount,
                    hasBundlePricing: item.hasBundlePricing,
                    ...(item.appliedBundle ? { appliedBundle: item.appliedBundle } : {}),
                    ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
                    ...(item.selectedAddons ? { selectedAddons: item.selectedAddons } : {})
                }));

                localStorage.setItem('pending_order', JSON.stringify(pendingOrder));
            }
        } catch (e) {
            console.error('Error syncing cart to pending order:', e);
        }
    }, []);

    // Enhanced addToCart that accepts pre-calculated pricing
    const addToCart = useCallback((
        item: MenuItem,
        quantity: number = 1,
        size?: string,
        addons?: string[],
        instructions?: string,
        pricingInfo?: {
            unitPrice: number;
            effectiveTotal: number;
            originalTotal: number;
            savings: number;
            appliedBundle?: { quantity: number; price: number; label?: string };
            hasDiscount: boolean;
            hasBundlePricing: boolean;
        }
    ) => {
        const unitPrice = pricingInfo?.unitPrice ?? item.price;
        const effectiveTotal = pricingInfo?.effectiveTotal ?? (unitPrice * quantity);
        const originalTotal = pricingInfo?.originalTotal ?? (item.price * quantity);
        const savings = pricingInfo?.savings ?? 0;

        const cartItem: CartItem = {
            ...item,
            quantity,
            cartId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            selectedSize: size,
            selectedAddons: addons,
            specialInstructions: instructions,
            unitPrice,
            effectiveTotal,
            originalTotal,
            savings,
            appliedBundle: pricingInfo?.appliedBundle,
            hasDiscount: pricingInfo?.hasDiscount ?? false,
            hasBundlePricing: pricingInfo?.hasBundlePricing ?? false
        };

        setCart(prev => {
            const newCart = [...prev, cartItem];
            syncToPendingOrder(newCart);
            return newCart;
        });

        setAnimateCart(true);
        setTimeout(() => setAnimateCart(false), 500);
    }, [syncToPendingOrder]);

    const updateQuantity = useCallback((cartId: string, delta: number) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.cartId === cartId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    
                    let newEffectiveTotal = item.unitPrice * newQty;
                    let appliedBundleInfo = undefined;
                    let hasBundlePricing = false;

                    // Dynamically recalculate bundle pricing
                    if (item.bundlePricing && item.bundlePricing.length > 0) {
                        const sortedBundles = [...item.bundlePricing].sort((a, b) => b.quantity - a.quantity);
                        const appliedBundle = sortedBundles.find(b => newQty >= b.quantity);
                        
                        if (appliedBundle) {
                            // Determine baseUnitPrice to isolate addonsPrice
                            let baseUnitPrice = item.hasDiscount && item.discountPrice ? item.discountPrice : item.price;
                            if (item.sizes && item.selectedSize) {
                                const sizeObj = item.sizes.find(s => s.name === item.selectedSize);
                                if (sizeObj) baseUnitPrice = sizeObj.price;
                            }
                            
                            const addonsPrice = item.unitPrice - baseUnitPrice;
                            const bundleCount = Math.floor(newQty / appliedBundle.quantity);
                            const remainingQty = newQty % appliedBundle.quantity;

                            // Apply bundle price to grouped items, normal unit price to remaining
                            const bundledCost = (bundleCount * appliedBundle.price) + (bundleCount * appliedBundle.quantity * addonsPrice);
                            const remainingCost = remainingQty * item.unitPrice;

                            newEffectiveTotal = bundledCost + remainingCost;
                            appliedBundleInfo = { quantity: appliedBundle.quantity, price: appliedBundle.price, label: appliedBundle.label };
                            hasBundlePricing = true;
                        }
                    }

                    const newOriginalTotal = item.price * newQty;

                    return {
                        ...item,
                        quantity: newQty,
                        effectiveTotal: newEffectiveTotal,
                        originalTotal: newOriginalTotal,
                        savings: newOriginalTotal - newEffectiveTotal,
                        appliedBundle: appliedBundleInfo,
                        hasBundlePricing
                    };
                }
                return item;
            });
            syncToPendingOrder(newCart);
            return newCart;
        });
    }, [syncToPendingOrder]);

    const removeFromCart = useCallback((cartId: string) => {
        setCart(prev => {
            const newCart = prev.filter(item => item.cartId !== cartId);
            syncToPendingOrder(newCart);
            return newCart;
        });
    }, [syncToPendingOrder]);

    const clearCart = useCallback(() => {
        setCart([]);
        localStorage.removeItem('pending_order');
    }, []);

    const updateInstructions = useCallback((cartId: string, instructions: string) => {
        setCart(prev => {
            const newCart = prev.map(item =>
                item.cartId === cartId ? { ...item, specialInstructions: instructions } : item
            );
            syncToPendingOrder(newCart);
            return newCart;
        });
    }, [syncToPendingOrder]);

    // Cart total uses effectiveTotal (already includes discounts/bundles)
    const cartTotal = cart.reduce((sum, item) => sum + item.effectiveTotal, 0);

    // Total savings from discounts and bundles
    const totalSavings = cart.reduce((sum, item) => sum + item.savings, 0);

    return {
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        updateInstructions,
        animateCart,
        cartTotal,
        totalSavings,
        restoreCartForSession
    };
};

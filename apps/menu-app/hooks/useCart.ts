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

    // Restore cart from pending_order if user is returning from a failed payment
    useEffect(() => {
        const pendingOrderStr = localStorage.getItem('pending_order');
        if (pendingOrderStr) {
            try {
                const pendingOrder = JSON.parse(pendingOrderStr);
                // Check if we're NOT on the payment-callback page (user returned after failure)
                if (pendingOrder.cart && !window.location.pathname.includes('payment-callback')) {
                    // Restore the cart with proper CartItem structure
                    const restoredCart: CartItem[] = pendingOrder.cart.map((item: any) => ({
                        ...item,
                        cartId: item.cartId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    }));
                    setCart(restoredCart);
                    console.log('Cart restored from pending order');
                }
            } catch (e) {
                console.error('Failed to restore cart from pending order:', e);
            }
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

        setCart(prev => {
            // For bundle items, always add as new line (don't merge)
            // This preserves the bundle pricing calculation
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

            return [...prev, cartItem];
        });

        setAnimateCart(true);
        setTimeout(() => setAnimateCart(false), 500);
    }, []);

    const updateQuantity = useCallback((cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(1, item.quantity + delta);

                // Recalculate pricing for new quantity
                // Note: For simplicity, we lose bundle pricing on quantity change
                // User should use modal to re-add with bundle pricing
                const newEffectiveTotal = item.unitPrice * newQty;
                const newOriginalTotal = item.price * newQty;

                return {
                    ...item,
                    quantity: newQty,
                    effectiveTotal: newEffectiveTotal,
                    originalTotal: newOriginalTotal,
                    savings: newOriginalTotal - newEffectiveTotal,
                    // Clear bundle if quantity changed
                    appliedBundle: undefined,
                    hasBundlePricing: false
                };
            }
            return item;
        }));
    }, []);

    const removeFromCart = useCallback((cartId: string) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const updateInstructions = useCallback((cartId: string, instructions: string) => {
        setCart(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, specialInstructions: instructions } : item
        ));
    }, []);

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
        totalSavings
    };
};

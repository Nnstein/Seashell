/**
 * Discount utility functions
 * Used by both Menu App and Management App
 */

interface DiscountInfo {
    hasDiscount: boolean;
    originalPrice: number;
    finalPrice: number;
    discountPercentage: number;
    discountLabel?: string;
}

interface BundleTier {
    quantity: number;
    price: number;
    label?: string;
}

interface BundleInfo {
    hasBundlePricing: boolean;
    tiers: BundleTier[];
    bestDeal?: {
        quantity: number;
        price: number;
        pricePerItem: number;
        savings: number;
        savingsPercentage: number;
    };
}

/**
 * Calculate discount information for an item
 */
export const getDiscountInfo = (
    originalPrice: number,
    discountPrice?: number,
    discountLabel?: string
): DiscountInfo => {
    if (!discountPrice || discountPrice >= originalPrice) {
        return {
            hasDiscount: false,
            originalPrice,
            finalPrice: originalPrice,
            discountPercentage: 0
        };
    }

    const discountPercentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);

    return {
        hasDiscount: true,
        originalPrice,
        finalPrice: discountPrice,
        discountPercentage,
        discountLabel
    };
};

/**
 * Get bundle pricing information
 */
export const getBundleInfo = (
    originalPrice: number,
    bundlePricing?: BundleTier[]
): BundleInfo => {
    if (!bundlePricing || bundlePricing.length === 0) {
        return {
            hasBundlePricing: false,
            tiers: []
        };
    }

    // Sort tiers by quantity
    const sortedTiers = [...bundlePricing].sort((a, b) => a.quantity - b.quantity);

    // Find the best deal (highest savings percentage)
    let bestDeal: BundleInfo['bestDeal'] | undefined;
    let maxSavingsPercentage = 0;

    for (const tier of sortedTiers) {
        const normalTotal = originalPrice * tier.quantity;
        const savings = normalTotal - tier.price;
        const savingsPercentage = (savings / normalTotal) * 100;

        if (savingsPercentage > maxSavingsPercentage) {
            maxSavingsPercentage = savingsPercentage;
            bestDeal = {
                quantity: tier.quantity,
                price: tier.price,
                pricePerItem: tier.price / tier.quantity,
                savings,
                savingsPercentage: Math.round(savingsPercentage)
            };
        }
    }

    return {
        hasBundlePricing: true,
        tiers: sortedTiers,
        bestDeal
    };
};

/**
 * Calculate the effective price for a given quantity
 * Considers bundle pricing if available
 */
export const calculateEffectivePrice = (
    originalPrice: number,
    quantity: number,
    discountPrice?: number,
    bundlePricing?: BundleTier[]
): { total: number; savings: number; appliedBundle?: BundleTier } => {
    // Use discounted unit price if available
    const unitPrice = discountPrice && discountPrice < originalPrice ? discountPrice : originalPrice;

    // Check for applicable bundle pricing
    if (bundlePricing && bundlePricing.length > 0) {
        // Find the best matching bundle tier
        const applicableTier = bundlePricing
            .filter(tier => quantity >= tier.quantity)
            .sort((a, b) => b.quantity - a.quantity)[0]; // Get the largest applicable tier

        if (applicableTier) {
            // Calculate how many complete bundles and remaining items
            const completeBundles = Math.floor(quantity / applicableTier.quantity);
            const remainingItems = quantity % applicableTier.quantity;

            const bundleTotal = completeBundles * applicableTier.price;
            const remainingTotal = remainingItems * unitPrice;
            const total = bundleTotal + remainingTotal;

            const normalTotal = quantity * originalPrice;
            const savings = normalTotal - total;

            return { total, savings, appliedBundle: applicableTier };
        }
    }

    // No bundle applies, use unit price
    const total = quantity * unitPrice;
    const normalTotal = quantity * originalPrice;
    const savings = normalTotal - total;

    return { total, savings };
};

/**
 * Format price for display (KWD format: 3 decimal places)
 */
export const formatPrice = (price: number): string => {
    return price.toFixed(3);
};

/**
 * Format discount percentage for display
 */
export const formatDiscountBadge = (percentage: number): string => {
    return `${percentage}% OFF`;
};

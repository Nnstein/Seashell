import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, Flame, Leaf, Nut, UtensilsCrossed, Tag, Percent } from 'lucide-react';
import { MenuItem, Language } from '../src/types';
import { getDiscountInfo, getBundleInfo, formatPrice } from '../utils/discountUtils';

interface PricingInfo {
    unitPrice: number;
    effectiveTotal: number;
    originalTotal: number;
    savings: number;
    appliedBundle?: { quantity: number; price: number; label?: string };
    hasDiscount: boolean;
    hasBundlePricing: boolean;
}

interface MenuItemModalProps {
    item: MenuItem;
    isOpen: boolean;
    onClose: () => void;
    onAdd: (
        item: MenuItem,
        quantity: number,
        size?: string,
        addons?: string[],
        instructions?: string,
        pricingInfo?: PricingInfo
    ) => void;
    language: Language;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ item, isOpen, onClose, onAdd, language }) => {
    const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [currentPrice, setCurrentPrice] = useState(item.price);
    const [note, setNote] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Initialize status when item opens
    useEffect(() => {
        if (isOpen) {
            if (item.sizes && item.sizes.length > 0) {
                setSelectedSize(item.sizes[0].name);
            } else {
                setSelectedSize(undefined);
            }
            setSelectedAddons([]);
            setQuantity(1);
            setNote('');
        }
    }, [isOpen, item]);

    // Price Calculation (unit price based on size/addons)
    useEffect(() => {
        let price = item.price;
        if (item.sizes && selectedSize) {
            const sizeObj = item.sizes.find(s => s.name === selectedSize);
            if (sizeObj) price = sizeObj.price;
        }
        if (item.addons && selectedAddons.length > 0) {
            item.addons.forEach(addon => {
                if (selectedAddons.includes(addon.name)) price += addon.price;
            });
        }
        setCurrentPrice(price);
    }, [item, selectedSize, selectedAddons]);

    // Calculate discount and bundle info
    const discountInfo = getDiscountInfo(item.price, item.discountPrice, item.discountLabel);
    const bundleInfo = getBundleInfo(item.price, item.bundlePricing);

    // Use discounted price if available for unit price
    const effectiveUnitPrice = discountInfo.hasDiscount ? discountInfo.finalPrice : currentPrice;

    // Calculate total price with bundle pricing applied
    const calculateTotalPrice = () => {
        const unitPrice = effectiveUnitPrice;

        // Check if bundle pricing applies
        if (item.bundlePricing && item.bundlePricing.length > 0) {
            // Sort bundles by quantity descending to find best match
            const sortedBundles = [...item.bundlePricing].sort((a, b) => b.quantity - a.quantity);

            let remainingQty = quantity;
            let totalPrice = 0;

            // Apply bundles from largest to smallest
            for (const bundle of sortedBundles) {
                if (remainingQty >= bundle.quantity) {
                    const bundleCount = Math.floor(remainingQty / bundle.quantity);
                    totalPrice += bundleCount * bundle.price;
                    remainingQty -= bundleCount * bundle.quantity;
                }
            }

            // Add remaining items at unit price
            totalPrice += remainingQty * unitPrice;

            return totalPrice;
        }

        // No bundles, use regular pricing
        return unitPrice * quantity;
    };

    const totalPrice = calculateTotalPrice();
    const regularPrice = effectiveUnitPrice * quantity;
    const savings = regularPrice - totalPrice;
    const hasBundleSavings = savings > 0.001; // Account for float precision

    // Find which bundle tier is applied (if any)
    const getAppliedBundle = () => {
        if (!item.bundlePricing || item.bundlePricing.length === 0) return null;
        const sortedBundles = [...item.bundlePricing].sort((a, b) => b.quantity - a.quantity);
        for (const bundle of sortedBundles) {
            if (quantity >= bundle.quantity) {
                return bundle;
            }
        }
        return null;
    };
    const appliedBundle = getAppliedBundle();

    if (!isOpen) return null;

    const handleAddonToggle = (addonName: string) => {
        setSelectedAddons(prev =>
            prev.includes(addonName)
                ? prev.filter(n => n !== addonName)
                : [...prev, addonName]
        );
    };

    const handleAddToOrder = () => {
        // Build pricing info for cart
        const pricingInfo: PricingInfo = {
            unitPrice: effectiveUnitPrice,
            effectiveTotal: totalPrice,
            originalTotal: item.price * quantity,
            savings: (item.price * quantity) - totalPrice,
            appliedBundle: appliedBundle || undefined,
            hasDiscount: discountInfo.hasDiscount,
            hasBundlePricing: hasBundleSavings
        };

        // Add with quantity and pricing info
        onAdd(item, quantity, selectedSize, selectedAddons, note, pricingInfo);
        onClose();
    };

    // Helpers
    const getName = () => {
        if (typeof item.name === 'object' && item.name !== null) {
            return (item.name as any)[language] || (item.name as any)['en'] || '';
        }
        return item.name;
    };

    const getDescription = () => {
        if (typeof item.description === 'object' && item.description !== null) {
            return (item.description as any)[language] || (item.description as any)['en'] || '';
        }
        return item.description;
    };

    const getImage = () => {
        if (item.images && item.images.length > 0) return item.images[0];
        return item.imageUrl || item.image || `https://source.unsplash.com/featured/?food,${item.category}`;
    };

    const isRTL = language === 'ar';

    // Tag icon mapping
    const getTagIcon = (tag: string) => {
        switch (tag) {
            case 'spicy':
                return <Flame size={14} className="text-white" />;
            case 'vegetarian':
                return <Leaf size={14} className="text-white" />;
            case 'nuts':
                return <Nut size={14} className="text-white" />;
            case 'traditional':
                return <UtensilsCrossed size={14} className="text-white" />;
            default:
                return null;
        }
    };

    const getTagLabel = (tag: string) => {
        const labels: Record<string, { en: string; ar: string }> = {
            spicy: { en: 'Spicy', ar: 'حار' },
            vegetarian: { en: 'Vegetarian', ar: 'نباتي' },
            nuts: { en: 'Contains Nuts', ar: 'يحتوي مكسرات' },
            traditional: { en: 'Traditional', ar: 'تقليدي' }
        };
        return labels[tag]?.[language] || tag;
    };

    const getTagColor = (tag: string) => {
        switch (tag) {
            case 'spicy': return 'bg-red-500';
            case 'vegetarian': return 'bg-green-500';
            case 'nuts': return 'bg-amber-600';
            case 'traditional': return 'bg-purple-600';
            default: return 'bg-stone-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative bg-white w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Image Header - Reduced height */}
                <div className="relative h-48 sm:h-72 flex-shrink-0 bg-stone-100">
                    <img
                        src={getImage()}
                        alt={getName()}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

                    {/* Discount Badge - Top Right */}
                    {discountInfo.hasDiscount && (
                        <div className="absolute top-3 right-3 z-10">
                            <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                                <Percent size={14} />
                                <span className="font-bold text-sm">{discountInfo.discountPercentage}% OFF</span>
                            </div>
                            {discountInfo.discountLabel && (
                                <div className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-b-lg text-center font-medium -mt-0.5">
                                    {discountInfo.discountLabel}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Price Display - Bottom Left */}
                    <div className={`absolute bottom-3 sm:bottom-4 ${isRTL ? 'right-4' : 'left-4'} text-white`}>
                        {hasBundleSavings ? (
                            // Bundle pricing applied
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-white/80 text-sm line-through">
                                    {formatPrice(regularPrice)} KD
                                </span>
                                <div className="bg-purple-600 px-3 py-1 rounded-full inline-block shadow-lg flex items-center gap-2">
                                    <Tag size={14} />
                                    <span className="font-bold text-sm tracking-wide">{formatPrice(totalPrice)} KD</span>
                                </div>
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                    Bundle: Save {formatPrice(savings)} KD
                                </span>
                            </div>
                        ) : discountInfo.hasDiscount ? (
                            // Item discount applied (no bundle)
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-white/80 text-sm line-through">
                                    {formatPrice(item.price * quantity)} KD
                                </span>
                                <div className="bg-red-500 px-3 py-1 rounded-full inline-block shadow-lg">
                                    <span className="font-bold text-sm tracking-wide">{formatPrice(totalPrice)} KD</span>
                                </div>
                            </div>
                        ) : (
                            // Regular pricing
                            <div className="bg-gold px-3 py-1 rounded-full inline-block mb-1 sm:mb-2 shadow-sm">
                                <span className="font-bold text-sm tracking-wide">{formatPrice(totalPrice)} KD</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Scrollable Area - Tighter padding and spacing */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">
                    <div>
                        <h2 className="font-serif text-xl sm:text-3xl font-bold text-stone-900 leading-tight mb-2 sm:mb-3">
                            {getName()}
                        </h2>
                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-sans">
                            {getDescription()}
                        </p>

                        {/* Tags with high contrast */}
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {item.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className={`${getTagColor(tag)} text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm`}
                                    >
                                        {getTagIcon(tag)}
                                        {getTagLabel(tag)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {item.note && (
                            <p className="text-stone-500 text-xs sm:text-sm font-sans mt-3 italic bg-stone-50 p-2 rounded-lg border-l-4 border-gold">
                                {item.note}
                            </p>
                        )}

                        {/* Bundle Deals Section */}
                        {bundleInfo.hasBundlePricing && bundleInfo.tiers.length > 0 && (
                            <div className="mt-4 bg-purple-50 rounded-xl p-4 border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag size={16} className="text-purple-600" />
                                    <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">
                                        {language === 'ar' ? 'عروض الحزم' : 'Bundle Deals'}
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {bundleInfo.tiers.map((tier, idx) => {
                                        const normalPrice = item.price * tier.quantity;
                                        const savings = normalPrice - tier.price;
                                        const savingsPercent = Math.round((savings / normalPrice) * 100);
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                                                        {tier.quantity}x
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-purple-800">
                                                            {formatPrice(tier.price)} KD
                                                        </span>
                                                        {tier.label && (
                                                            <span className="ml-2 text-xs text-purple-600 italic">
                                                                {tier.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-stone-400 line-through mr-2">
                                                        {formatPrice(normalPrice)} KD
                                                    </span>
                                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                        Save {savingsPercent}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-purple-600 mt-2 italic">
                                    {language === 'ar'
                                        ? 'أضف الكمية المطلوبة للحصول على سعر الحزمة'
                                        : 'Add the required quantity to get the bundle price'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Customization Section */}
                    {((item.sizes && item.sizes.length > 0) || (item.addons && item.addons.length > 0)) && (
                        <div className="space-y-4 sm:space-y-6 pt-0">
                            {/* Sizes */}
                            {item.sizes && item.sizes.length > 0 && (
                                <div className="space-y-2 sm:space-y-3">
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest">
                                        {language === 'ar' ? 'الحجم' : 'Size'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {item.sizes.map((size) => (
                                            <button
                                                key={size.name}
                                                onClick={() => setSelectedSize(size.name)}
                                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all duration-200 ${selectedSize === size.name
                                                    ? 'border-gold bg-gold text-white shadow-md transform scale-105'
                                                    : 'border-stone-100 bg-stone-50 text-stone-600 hover:border-gold/30'
                                                    }`}
                                            >
                                                {size.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Addons */}
                            {item.addons && item.addons.length > 0 && (
                                <div className="space-y-2 sm:space-y-3">
                                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest">
                                        {language === 'ar' ? 'إضافات' : 'Add-ons'}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {item.addons.map((addon) => (
                                            <button
                                                key={addon.name}
                                                onClick={() => handleAddonToggle(addon.name)}
                                                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 group ${selectedAddons.includes(addon.name)
                                                    ? 'border-gold bg-gold/5 text-gold'
                                                    : 'border-stone-100 bg-white text-stone-600 hover:border-gold/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-colors ${selectedAddons.includes(addon.name) ? 'bg-gold border-gold text-white' : 'border-stone-300'
                                                        }`}>
                                                        {selectedAddons.includes(addon.name) && <Check size={10} />}
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-medium">{addon.name}</span>
                                                </div>
                                                <span className="text-xs font-bold">+{addon.price.toFixed(3)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Special Instructions */}
                    <div className="space-y-2 sm:space-y-3">
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest">
                            {language === 'ar' ? 'ملاحظات' : 'Special Request'}
                        </h3>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={language === 'ar' ? 'أي طلبات خاصة؟' : 'Any special requests?'}
                            className="w-full p-3 sm:p-4 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none h-20 sm:h-24"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-6 border-t border-stone-100 bg-white flex items-center gap-3 sm:gap-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-2 sm:gap-3 bg-stone-100 rounded-xl p-1">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-gold active:scale-95 transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="w-4 text-center font-bold text-base sm:text-lg">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-gold active:scale-95 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddToOrder}
                        className={`flex-1 h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${hasBundleSavings
                            ? 'bg-purple-600 text-white shadow-purple-500/30 hover:shadow-purple-500/50'
                            : 'bg-gold text-white shadow-gold/30 hover:shadow-gold/50'
                            }`}
                    >
                        {hasBundleSavings && <Tag size={14} />}
                        <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
                        <span>•</span>
                        <span>{formatPrice(totalPrice)} KD</span>
                        {hasBundleSavings && (
                            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded ml-1">
                                -{formatPrice(savings)}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemModal;

import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, Check } from 'lucide-react';
import { MenuItem, Language } from '../src/types';

interface MenuItemModalProps {
    item: MenuItem;
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: MenuItem, size?: string, addons?: string[], instructions?: string) => void;
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

    // Price Calculation
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

    if (!isOpen) return null;

    const handleAddonToggle = (addonName: string) => {
        setSelectedAddons(prev =>
            prev.includes(addonName)
                ? prev.filter(n => n !== addonName)
                : [...prev, addonName]
        );
    };

    const handleAddToOrder = () => {
        for (let i = 0; i < quantity; i++) {
            onAdd(item, selectedSize, selectedAddons, note);
        }
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
                    <div className={`absolute bottom-3 sm:bottom-4 ${isRTL ? 'right-4' : 'left-4'} text-white`}>
                        <div className="bg-gold px-3 py-1 rounded-full inline-block mb-1 sm:mb-2 shadow-sm">
                            <span className="font-bold text-sm tracking-wide">{(currentPrice * quantity).toFixed(3)} KD</span>
                        </div>
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
                        className="flex-1 bg-gold text-white h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-gold/30 hover:shadow-gold/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
                        <span>•</span>
                        <span>{(currentPrice * quantity).toFixed(3)} KD</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemModal;

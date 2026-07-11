import React from 'react';
import { MenuItem, Language } from '../src/types';
import { Flame, Leaf, Nut, UtensilsCrossed, Tag, Percent, Clock } from 'lucide-react';
import { getDiscountInfo, getBundleInfo, formatPrice } from '../utils/discountUtils';
import { checkItemTimeAvailability } from '../utils/timeConstraints';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem, quantity?: number, size?: string, addons?: string[], instructions?: string, pricingInfo?: any) => void;
  onCardClick?: (item: MenuItem) => void;
  theme: string;
  language: Language;
  activeMenu: string | null;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onCardClick, language, activeMenu }) => {
  // Helper to get localized string
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
    // Use first image from images array if available, else legacy image
    if (item.images && item.images.length > 0) return item.images[0];
    return item.imageUrl || item.image || `https://source.unsplash.com/featured/?food,${item.category}`;
  };

  const accentColor = "bg-gold";

  // Calculate discount info
  const discountInfo = getDiscountInfo(item.price, item.discountPrice, item.discountLabel);
  const bundleInfo = getBundleInfo(item.price, item.bundlePricing);

  // Tag icon mapping
  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'spicy':
        return <Flame size={16} className="text-red-500" />;
      case 'vegetarian':
        return <Leaf size={16} className="text-green-500" />;
      case 'nuts':
        return <Nut size={16} className="text-amber-600" />;
      case 'traditional':
        return <UtensilsCrossed size={16} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const timeAvailability = checkItemTimeAvailability(item, activeMenu);
  const isAvailable = item.isAvailable !== false && timeAvailability.isAvailable;

  return (
    <div
      onClick={() => isAvailable && onCardClick && onCardClick(item)}
      className={`bg-white rounded-lg sm:rounded-3xl overflow-hidden shadow-sm sm:shadow-md transition-all duration-300 group flex flex-col h-full border border-stone-100 relative sm:hover:-translate-y-1 transform-gpu cursor-pointer active:scale-95 ${!isAvailable ? 'grayscale opacity-75 cursor-not-allowed sm:hover:translate-y-0 active:scale-100' : 'hover:shadow-xl'}`}
    >
      {/* Not Available Overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white/95 px-3 py-1 sm:px-6 sm:py-3 rounded-2xl sm:rounded-full shadow-2xl border-2 border-stone-300 flex flex-col items-center justify-center max-w-[90%] text-center transform -rotate-6">
            {!timeAvailability.isAvailable && <Clock size={16} className="text-red-500 mb-1 sm:hidden" />}
            {!timeAvailability.isAvailable && <Clock size={24} className="text-red-500 mb-1 hidden sm:block" />}
            <span className="text-stone-800 font-bold uppercase tracking-widest text-[10px] sm:text-base mb-0.5">
              {language === 'ar' ? 'غير متوفر' : 'Not Available'}
            </span>
            {!timeAvailability.isAvailable && timeAvailability.message && (
              <span className="text-red-600 font-medium text-[8px] sm:text-xs">
                {timeAvailability.message[language]}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Image Section */}
      <div className="relative w-full h-24 sm:h-56 overflow-hidden flex-shrink-0">
        <img
          src={getImage()}
          alt={getName()}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300"></div>

        {/* Discount Badge - Upper Right */}
        {discountInfo.hasDiscount && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-red-500 text-white px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 animate-pulse">
              <Percent size={12} />
              <span className="font-bold text-xs sm:text-sm">{discountInfo.discountPercentage}% OFF</span>
            </div>
            {discountInfo.discountLabel && (
              <div className="bg-amber-500 text-white text-[8px] sm:text-xs px-2 py-0.5 rounded-b-lg text-center font-medium -mt-1">
                {discountInfo.discountLabel}
              </div>
            )}
          </div>
        )}

        {/* Bundle Deal Badges - Upper Right (if no item discount) - Show ALL tiers */}
        {!discountInfo.hasDiscount && bundleInfo.hasBundlePricing && bundleInfo.tiers.length > 0 && (
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
            {bundleInfo.tiers.map((tier, idx) => (
              <div key={idx} className="bg-purple-600 text-white px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                <Tag size={10} />
                <span className="font-bold text-[10px] sm:text-xs">
                  {tier.quantity} for {formatPrice(tier.price)} KD
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tag Icons - Upper Left */}
        {item.tags && item.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {item.tags.map((tag, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md"
                title={tag.charAt(0).toUpperCase() + tag.slice(1)}
              >
                {getTagIcon(tag)}
              </div>
            ))}
          </div>
        )}

        {/* Price Tag - Shows discount pricing if available */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-4 sm:right-4">
          {discountInfo.hasDiscount ? (
            <div className="flex flex-col items-end gap-0.5">
              {/* Original Price - Strikethrough */}
              <span className="text-white/80 text-[8px] sm:text-sm line-through">
                {formatPrice(discountInfo.originalPrice)} KD
              </span>
              {/* Discounted Price */}
              <span className={`font-sans font-bold text-[10px] sm:text-lg text-white bg-red-500 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg`}>
                {formatPrice(discountInfo.finalPrice)} KD
              </span>
            </div>
          ) : (
            <span className={`font-sans font-bold text-[10px] sm:text-lg text-white ${accentColor} px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm`}>
              {formatPrice(item.price)} KD
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-2 sm:p-6 flex flex-col flex-grow relative">
        <h3 className="font-serif text-xs sm:text-xl font-bold text-stone-900 leading-tight mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-none h-8 sm:h-auto">{getName()}</h3>
        <p className="text-stone-600 text-[9px] sm:text-sm leading-relaxed font-sans line-clamp-2 mb-0 h-7 sm:h-auto">{getDescription()}</p>
        {item.note && (
          <p className="text-secondary/70 text-[8px] sm:text-xs font-sans mt-1 line-clamp-1 italic">
            {item.note.includes(';') && item.note.split(';').length > 3
              ? `${item.note.split(';').slice(0, 3).join(';')} ...`
              : item.note}
          </p>
        )}

        {/* Bundle Pricing Hint - Show on card if bundles available */}
        {bundleInfo.hasBundlePricing && (
          <div className="mt-auto pt-2">
            <div className="text-purple-600 text-[8px] sm:text-xs font-medium flex items-center gap-1">
              <Tag size={10} />
              <span>Bundle deals available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MenuItemCard);
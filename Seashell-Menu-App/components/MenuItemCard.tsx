import React from 'react';
import { MenuItem, Language } from '../src/types';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem, size?: string, addons?: string[], instructions?: string) => void;
  onCardClick?: (item: MenuItem) => void;
  theme: string;
  language: Language;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onCardClick, language }) => {
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

  // Use base price
  const price = item.price;

  return (
    <div
      onClick={() => onCardClick && onCardClick(item)}
      className="bg-white rounded-lg sm:rounded-3xl overflow-hidden shadow-sm sm:shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-stone-100 relative sm:hover:-translate-y-1 transform-gpu cursor-pointer active:scale-95"
    >

      {/* Image Section */}
      <div className="relative w-full h-28 sm:h-56 overflow-hidden flex-shrink-0">
        <img
          src={getImage()}
          alt={getName()}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300"></div>

        {/* Price Tag */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-4 sm:right-4">
          <span className={`font-sans font-bold text-[10px] sm:text-lg text-white ${accentColor} px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm`}>
            {price.toFixed(3)} KD
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-2.5 sm:p-6 flex flex-col flex-grow relative">
        <h3 className="font-serif text-xs sm:text-xl font-bold text-stone-900 leading-tight mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-none h-8 sm:h-auto">{getName()}</h3>
        <p className="text-stone-600 text-[9px] sm:text-sm leading-relaxed font-sans line-clamp-2 mb-0 h-7 sm:h-auto">{getDescription()}</p>
      </div>
    </div>
  );
};

export default React.memo(MenuItemCard);
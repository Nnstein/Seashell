import React from 'react';
import { Plus } from 'lucide-react';
import { HousekeepingItem } from '../types';
import { useApp } from '../context/AppContext';

interface ItemCardProps {
    item: HousekeepingItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
    const { language, addToRequest } = useApp();

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
        return item.image || item.imageUrl || `https://source.unsplash.com/featured/?household,${item.category}`;
    };

    return (
        <div className="bg-white rounded-lg sm:rounded-3xl overflow-hidden shadow-sm sm:shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-stone-100 relative sm:hover:-translate-y-1 transform-gpu">

            {/* Image Section */}
            <div className="relative w-full h-24 sm:h-56 overflow-hidden flex-shrink-0">
                <img
                    src={getImage()}
                    alt={getName()}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300"></div>
            </div>

            {/* Content Section */}
            <div className="p-2 sm:p-6 flex flex-col flex-grow relative">
                <h3 className="font-serif text-xs sm:text-xl font-bold text-stone-900 leading-tight mb-1 sm:mb-2 line-clamp-2">{getName()}</h3>
                <p className="text-stone-600 text-[10px] sm:text-sm leading-relaxed font-sans line-clamp-2 mb-2 sm:mb-4">{getDescription()}</p>

                {/* Add Button */}
                <button
                    onClick={() => addToRequest(item)}
                    className="w-full bg-gold text-white py-1.5 sm:py-3 rounded sm:rounded-xl shadow-sm sm:shadow-lg transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 font-bold tracking-wide mt-auto text-[10px] sm:text-base hover:bg-gold/90"
                >
                    <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span>Add to Request</span>
                </button>
            </div>
        </div>
    );
};

export default ItemCard;

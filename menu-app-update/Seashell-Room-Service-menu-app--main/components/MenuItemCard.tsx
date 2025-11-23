import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem, Theme, Language } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  theme: Theme;
  language: Language;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAdd, theme, language }) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group flex flex-row sm:flex-col h-full border border-white/20 relative sm:hover:-translate-y-2">
      
      {/* Image Section */}
      <div className="relative w-32 min-w-[8rem] sm:w-full sm:min-w-0 h-auto sm:h-56 overflow-hidden flex-shrink-0">
        <img
          src={item.image}
          alt={item.name[language]}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300"></div>
        
        {/* Desktop Hover Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(item);
          }}
          className={`hidden sm:flex absolute bottom-4 ${language === 'ar' ? 'left-4' : 'right-4'} ${theme.accentColor} text-white p-3 rounded-full shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 items-center justify-center z-10 hover:scale-110`}
          aria-label={`Add ${item.name[language]} to order`}
        >
          <Plus size={24} />
        </button>
      </div>
      
      {/* Content Section */}
      <div className="p-3 sm:p-6 flex flex-col flex-grow justify-between relative">
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-3">
            <h3 className="font-serif text-base sm:text-xl font-bold text-stone-900 leading-tight group-hover:text-stone-600 transition-colors line-clamp-2">{item.name[language]}</h3>
            <div className="mt-1 sm:mt-0">
               <span className={`font-sans font-bold text-sm sm:text-lg text-white ${theme.accentColor} px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm inline-block`}>
                 {item.price.toFixed(3)}
               </span>
            </div>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-sans line-clamp-2 sm:line-clamp-3">{item.description ? item.description[language] : ''}</p>
        </div>

        {/* Mobile Add Button (Visible in text area) */}
        <div className="sm:hidden mt-3 flex justify-end">
           <button
             onClick={(e) => {
               e.stopPropagation();
               onAdd(item);
             }}
             className={`${theme.accentColor} text-white p-2 rounded-full shadow-md active:scale-95 transition-transform`}
           >
             <Plus size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MenuItemCard);
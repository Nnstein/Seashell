import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category, Language } from '../types';

interface CategoryCarouselProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  language: Language;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ categories, activeCategory, onSelectCategory, language }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRTL = language === 'ar';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const current = scrollRef.current;
      const scrollAmount = 200;
      const logicDirection = isRTL ? (direction === 'left' ? 'right' : 'left') : direction;
      const multiplier = logicDirection === 'left' ? -1 : 1;

      current.scrollBy({
        left: scrollAmount * multiplier,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group my-2 sm:my-4" dir="ltr"> 
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
        <button
          onClick={() => scroll('left')}
          className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-full shadow-lg text-white hover:bg-gold transition-all duration-300 -ml-2 md:-ml-6 opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          <ChevronLeft size={24} />
        </button>

        <div
          ref={scrollRef}
          className={`flex gap-3 sm:gap-6 overflow-x-auto pb-4 sm:pb-12 pt-4 sm:pt-8 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 ${isRTL ? 'flex-row-reverse' : ''}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`
                  relative flex-none w-24 h-20 sm:w-56 sm:h-36 rounded-xl sm:rounded-2xl snap-center transition-all duration-500 ease-out
                  group/card overflow-hidden shadow-lg
                  ${isActive ? 'scale-105 sm:scale-110 ring-2 ring-gold shadow-gold/30 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}
                `}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Background Image - Always visible */}
                <img 
                  src={cat.image} 
                  alt={cat.name[language]} 
                  className={`
                    absolute inset-0 w-full h-full object-cover transition-transform duration-700
                    ${isActive ? 'scale-110' : 'scale-100 group-hover/card:scale-110'}
                  `}
                />
                
                {/* Gradient Overlay for readability */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-80' : 'opacity-70 group-hover/card:opacity-60'}`}></div>

                {/* Content Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-300">
                   <span className={`
                     font-serif text-xs sm:text-xl font-bold text-center z-10 transition-all duration-300 drop-shadow-md leading-tight
                     ${isActive ? 'text-gold translate-y-0' : 'text-white translate-y-1 sm:translate-y-2 group-hover/card:translate-y-0'}
                   `}>
                     {cat.name[language]}
                   </span>
                   
                   {/* Active Indicator Line */}
                   <div className={`h-0.5 bg-gold mt-1 sm:mt-2 rounded-full transition-all duration-500 ${isActive ? 'w-8 sm:w-12 opacity-100' : 'w-0 opacity-0 group-hover/card:w-8 group-hover/card:opacity-100'}`}></div>
                </div>

                {/* Active Glow */}
                {isActive && <div className="absolute inset-0 border-2 border-gold/50 rounded-xl sm:rounded-2xl pointer-events-none animate-pulse"></div>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-full shadow-lg text-white hover:bg-gold transition-all duration-300 -mr-2 md:-mr-6 opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(CategoryCarousel);
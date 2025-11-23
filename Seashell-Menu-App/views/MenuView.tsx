import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MENU_DATA } from '../data';
import Hero from '../components/Hero';
import CategoryCarousel from '../components/CategoryCarousel';
import MenuItemCard from '../components/MenuItemCard';

const MenuView: React.FC = () => {
  const { activeCategory, setActiveCategory, language, addToCart } = useApp();
  
  const currentCategoryData = useMemo(() => 
    MENU_DATA.find(cat => cat.id === activeCategory) || MENU_DATA[0], 
  [activeCategory]);

  return (
    <div className="pb-20">
      <Hero 
        activeCategoryName={currentCategoryData.name[language]} 
        theme={currentCategoryData.theme} 
        language={language} 
      />
      
      <section className="pb-2 px-2 sm:pb-4 sm:px-4 relative z-30 -mt-4 sm:-mt-4">
        <CategoryCarousel 
          categories={MENU_DATA} 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory}
          language={language}
        />
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-fade-in-up">
          {currentCategoryData.items.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAdd={addToCart}
              theme={currentCategoryData.theme}
              language={language}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default MenuView;
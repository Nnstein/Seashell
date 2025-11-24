import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Hero from '../components/Hero';

import CategoryCarousel from '../components/CategoryCarousel';
import MenuItemCard from '../components/MenuItemCard';
import { CATEGORIES } from '../constants';

const MenuView: React.FC = () => {
  const { activeCategory, setActiveCategory, language, addToCart, menuItems, loadingMenu } = useApp();

  // Filter items by active category
  const currentItems = useMemo(() =>
    menuItems.filter(item => item.category === activeCategory && item.isAvailable),
    [menuItems, activeCategory]);

  // Get category details for theme/display
  // If CATEGORIES are not in data.ts, we might need to define them or fetch them
  // For now, let's assume we can get basic info or fallback
  const currentCategoryName = activeCategory;

  if (loadingMenu) {
    return <div className="flex justify-center items-center h-screen">Loading menu...</div>;
  }

  return (
    <div className="pb-20">
      <Hero
        activeCategoryName={currentCategoryName}
        theme="light" // Default theme or derive from category
        language={language}
      />

      <section className="pb-2 px-2 sm:pb-4 sm:px-4 relative z-30 -mt-4 sm:-mt-4">
        <CategoryCarousel
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          language={language}
        />
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-fade-in-up">
          {currentItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAdd={addToCart}
              theme="light"
              language={language}
            />
          ))}
          {currentItems.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              No items available in this category.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MenuView;
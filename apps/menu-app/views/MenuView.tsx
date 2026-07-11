import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';
import CategoryCarousel from '../components/CategoryCarousel';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemModal from '../components/MenuItemModal';

import { getMenuDataByType, CATEGORY_IMAGES, CATEGORY_NAMES } from '../data';
import { MenuItem } from '../src/types';

const MenuView: React.FC = () => {
  const { activeCategory, setActiveCategory, language, addToCart, menuItems, loadingMenu, categoryImages, searchQuery, setSearchQuery, activeMenu, setActiveMenu, currentMenuCategories } = useApp();
  const [isSticky, setIsSticky] = React.useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const searchBarRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const handleScroll = () => {
      if (searchBarRef.current) {
        // Calculate threshold based on screen width (mobile vs desktop navbar height)
        const isMobile = window.innerWidth < 640;
        const navbarHeight = isMobile ? 72 : 96;

        // Get the top position of the placeholder relative to the viewport
        const rect = searchBarRef.current.getBoundingClientRect();

        // If the placeholder hits the navbar bottom, make it sticky
        setIsSticky(rect.top <= navbarHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Filter items by active category and search query
  const currentItems = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return menuItems.filter(item => {
        // Ensure we only search within the active menu
        const belongsToMenu = item.menu === activeMenu || (!item.menu && activeMenu === 'room-service');
        if (!belongsToMenu) return false;

        const name = typeof item.name === 'object' ? item.name.en : item.name;
        const description = typeof item.description === 'object' ? item.description.en : item.description;
        const category = item.category;

        return (
          name.toLowerCase().includes(query) ||
          description?.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        );
      });
    }

    // If no search query, filter by active menu AND active category
    return menuItems.filter(item => 
      (item.menu === activeMenu || (!item.menu && activeMenu === 'room-service')) && 
      item.category === activeCategory
    );
  }, [menuItems, activeMenu, activeCategory, searchQuery]);

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
        theme={{ textColor: 'text-white/90', accentColor: 'bg-gold' }}
        language={language}
      />



      {/* Search Bar - JS Sticky Implementation */}
      <div ref={searchBarRef} className="relative z-30">
        {/* Placeholder to prevent layout shift when fixed */}
        <div style={{ height: isSticky ? '80px' : '0' }} className="w-full" />

        <div
          className={`px-3 sm:px-6 lg:px-8 py-4 w-full pointer-events-none ${isSticky
            ? 'fixed top-[72px] sm:top-[96px] left-0 right-0'
            : 'relative'
            }`}
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search for dishes, drinks, or keywords..."
            />
          </div>
        </div>
      </div>

      <section className="pb-2 px-2 sm:pb-4 sm:px-4 relative z-20">
        <CategoryCarousel
          categories={currentMenuCategories.map(catName => ({
            id: catName,
            name: CATEGORY_NAMES[catName] || { en: catName, ar: catName },
            image: categoryImages[catName] || CATEGORY_IMAGES[catName] || '/assets/images/categories/main.jpg'
          }))}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          language={language}
        />
      </section>

      <section className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 pt-2 sm:pt-8 min-h-screen">
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-fade-in-up">
          {currentItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAdd={addToCart}
              onCardClick={setSelectedItem}
              theme="light"
              language={language}
              activeMenu={activeMenu}
            />
          ))}
          {currentItems.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              No items available in this category.
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          onAdd={addToCart}
          language={language}
        />
      )}
    </div>
  );
};

export default MenuView;
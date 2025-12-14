import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CategoryCarousel from '../components/CategoryCarousel';
import ItemCard from '../components/ItemCard';
import RequestDrawer from '../components/RequestDrawer';

const MainView: React.FC = () => {
    const { activeCategory, categories, housekeepingItems, language } = useApp();
    const activeCategoryData = categories.find(c => c.id === activeCategory);

    // Filter items for current category
    const currentItems = housekeepingItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-paper pb-20">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
            </div>

            {activeCategoryData && <Header theme={activeCategoryData.theme} />}

            <main className="pt-24 px-2 sm:px-4 max-w-7xl mx-auto relative z-10">

                {/* Categories */}
                <CategoryCarousel categories={categories} />

                {/* Category Title */}
                <div className="my-6 sm:my-10 text-center animate-fade-in">
                    <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-800 mb-2">
                        {activeCategoryData?.name[language]}
                    </h2>
                    <div className="h-1 w-20 bg-gold mx-auto rounded-full"></div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-6 pb-10">
                    {currentItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ItemCard item={item} />
                        </div>
                    ))}
                </div>
            </main>

            <RequestDrawer />
        </div>
    );
};

export default MainView;

import React from 'react';
import Header from './Header';
import OrderDrawer from './OrderDrawer';
import BackgroundController from './BackgroundController';
import { useApp } from '../context/AppContext';
import { MENU_DATA } from '../data';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { view, language, activeCategory } = useApp();
  
  const currentCategoryData = MENU_DATA.find(cat => cat.id === activeCategory) || MENU_DATA[0];
  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${isRTL ? 'font-arabic' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Persistent Background */}
      <BackgroundController />

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col min-h-screen">
        
        {/* Header is shown on non-HOME views */}
        {view !== 'HOME' && (
          <Header theme={currentCategoryData.theme} />
        )}

        <main className="flex-grow">
          {children}
        </main>
      </div>

      {/* Persistent Drawer with Key to prevent flashing on lang switch */}
      <OrderDrawer key={language} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;
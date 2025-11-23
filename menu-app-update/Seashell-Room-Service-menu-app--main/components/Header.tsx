import React from 'react';
import { ArrowLeft, ClipboardList, ChevronRight } from 'lucide-react';
import { Theme } from '../types';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  theme: Theme;
}

const Header: React.FC<HeaderProps> = ({ theme }) => {
  const { cart, setIsCartOpen, setView, view, animateCart, language } = useApp();
  const isRTL = language === 'ar';
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 transition-all duration-500 pt-2 sm:pt-4 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto backdrop-blur-md bg-black/30 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          {view === 'CONFIRMATION' && (
             <button onClick={() => setView('HOME')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
               {isRTL ? <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
             </button>
          )}
          <div className="cursor-pointer group text-center sm:text-left" onClick={() => setView('HOME')}>
            <h1 className="font-serif text-xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-gold transition-colors duration-300 drop-shadow-md">PRESTO</h1>
            <p className="text-[8px] sm:text-[10px] font-sans tracking-[0.2em] text-white/70 uppercase group-hover:tracking-[0.3em] transition-all duration-500">Coffee & More</p>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className={`relative group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-xl transition-all duration-300 ${theme.accentColor} text-white hover:brightness-110 ${animateCart ? 'scale-110 ring-4 ring-white/30' : ''}`}
        >
          <span className="font-medium text-xs sm:text-sm hidden sm:block tracking-wide">{UI_TEXT.myOrder[language]}</span>
          <ClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 ${animateCart ? 'animate-bounce' : ''}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-stone-900 text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
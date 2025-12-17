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
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-500 pt-2 sm:pt-4 px-2 sm:px-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto backdrop-blur-md bg-black/30 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          {view === 'CONFIRMATION' && (
            <button onClick={() => setView('HOME')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
              {isRTL ? <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}
          <div className="cursor-pointer group flex flex-col items-center sm:items-start leading-none px-2" onClick={() => setView('HOME')}>
            <span className="font-serif text-[10px] sm:text-xs italic text-white/90 group-hover:text-gold transition-all duration-300 transform group-hover:-translate-y-0.5">seashell</span>
            <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-widest text-white uppercase group-hover:text-gold transition-all duration-300 drop-shadow-md">F&B</h1>
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
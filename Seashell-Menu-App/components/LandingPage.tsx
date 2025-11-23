import React, { useState } from 'react';
import { ArrowRight, Globe, KeyRound } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';

const LandingPage: React.FC = () => {
  const { language, toggleLanguage, setView, setRoomNumber } = useApp();
  const [inputRoom, setInputRoom] = useState('');
  const [error, setError] = useState(false);
  const isRTL = language === 'ar';

  const handleLogin = () => {
    if (!inputRoom.trim()) {
      setError(true);
      return;
    }
    setRoomNumber(inputRoom);
    setView('MENU');
  };

  return (
    <div className={`relative h-screen w-full flex flex-col items-center justify-center overflow-hidden ${isRTL ? 'font-arabic' : 'font-serif'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Content Container */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
        
        {/* Language Switcher */}
        <div className="absolute top-[-15vh] left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 sm:mb-12">
           <button 
             onClick={toggleLanguage}
             className="flex items-center justify-center gap-2 mx-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white transition-all duration-300"
           >
             <Globe size={16} />
             <span className="text-sm uppercase tracking-widest font-sans">
               {language === 'en' ? 'العربية' : 'English'}
             </span>
           </button>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
          {UI_TEXT.welcomeTitle[language]}
        </h1>
        
        <p className="text-xl md:text-2xl text-stone-200 font-light mb-10 max-w-2xl mx-auto drop-shadow-lg leading-relaxed">
           {UI_TEXT.welcomeSubtitle[language]}
        </p>
        
        {/* Room Number Login */}
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Room Number Prompt */}
          <p className="text-stone-200 text-lg font-medium tracking-wide drop-shadow-md mb-1 opacity-90">
             {UI_TEXT.enterRoomPrompt[language]}
          </p>

          <div className="relative w-full">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/60">
               <KeyRound size={20} />
             </div>
             <input 
               type="text" 
               placeholder={UI_TEXT.enterRoom[language]}
               value={inputRoom}
               onChange={(e) => {
                 setInputRoom(e.target.value);
                 setError(false);
               }}
               className={`
                 w-full bg-white/10 backdrop-blur-md border-2 rounded-full py-4 px-12 text-white placeholder-white/50 focus:outline-none focus:border-gold/80 text-lg transition-colors
                 ${error ? 'border-red-500/80' : 'border-white/20'}
               `}
             />
          </div>

          <button 
            onClick={handleLogin}
            className="w-full group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-gold/90 hover:bg-gold backdrop-blur-md rounded-full text-white overflow-hidden transition-all duration-500 shadow-[0_0_40px_rgba(212,175,55,0.2)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)]"
          >
            <span className="relative z-10 text-lg font-bold tracking-widest uppercase">
              {UI_TEXT.viewMenu[language]}
            </span>
            <div className={`relative z-10 transition-transform duration-500 ${isRTL ? 'group-hover:-translate-x-2 rotate-180' : 'group-hover:translate-x-2'}`}>
              <ArrowRight size={24} />
            </div>
          </button>
        </div>
      </div>

      {/* Decorative 3D Overlay Effects */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"></div>
    </div>
  );
};

export default LandingPage;
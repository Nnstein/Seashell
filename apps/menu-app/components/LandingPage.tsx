import React, { useState } from 'react';
import { ArrowRight, Globe, KeyRound, Phone } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { normalizePhone, validateDynamicSection } from '../utils/validation';
import { getSections } from '../services/firestoreService';
import { LocationSection } from '../src/types';

interface LandingPageProps {
  isBeachMode?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isBeachMode = false }) => {
  const { 
    language, 
    toggleLanguage, 
    setView, 
    setRoomNumber, 
    setPhoneNumber, 
    saveSession, 
    clearCart, 
    restoreCartForSession,
    setActiveMenu 
  } = useApp();
  const { showError } = useToast();
  
  const [inputRoom, setInputRoom] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [roomError, setRoomError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [sections, setSections] = useState<LocationSection[]>([]);
  const isRTL = language === 'ar';

  React.useEffect(() => {
    getSections().then(setSections);
  }, []);

  // Find matching section based on current input to determine if phone is required
  const requiresPhone = React.useMemo(() => {
    if (sections.length === 0) return true;
    
    const availableSections = sections.filter(s => 
      isBeachMode ? s.menu === 'seashell' : s.menu !== 'seashell'
    );
    
    const trimmed = inputRoom.trim().toUpperCase();
    const match = trimmed.match(/^([A-Z]*)/);
    
    if (match) {
      const prefix = match[1];
      let matchedSection;
      
      if (prefix === '') {
        matchedSection = availableSections.find(s => s.isDefault);
      } else {
        matchedSection = availableSections.find(s => s.prefix.toUpperCase() === prefix);
      }
      
      if (matchedSection) {
        return matchedSection.requiresPhone;
      }
    }
    
    return true; // Default to true if we can't figure it out yet
  }, [inputRoom, sections, isBeachMode]);

  const handleLogin = () => {
    setRoomError(false);
    setPhoneError(false);

    if (sections.length === 0) {
       showError('Loading sections, please try again...');
       return;
    }

    const validation = validateDynamicSection(inputRoom, sections, isBeachMode);
    
    if (!validation.valid || !validation.section) {
      setRoomError(true);
      showError(validation.error || 'Invalid location code');
      return;
    }

    const matchedSection = validation.section;
    const selectedMenu = matchedSection.menu;
    const finalRoom = validation.normalized;
    let finalPhone = '00000000';

    if (matchedSection.requiresPhone) {
      const phoneResult = normalizePhone(inputPhone);
      if (!phoneResult.valid) {
        setPhoneError(true);
        showError(phoneResult.error || 'Invalid phone number');
        return;
      }
      finalPhone = phoneResult.normalized;
    }

    // Clear any leftover cart
    clearCart();

    // Set Session State
    setRoomNumber(finalRoom);
    setPhoneNumber(finalPhone);
    setActiveMenu(selectedMenu);

    saveSession(finalRoom, finalPhone);
    restoreCartForSession(finalRoom);
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

        <div className="mb-8 flex justify-center animate-fade-in-up">
           <img 
             src="assets/images/logo.png" 
             alt="Seashell Logo" 
             className="w-32 xs:w-40 md:w-56 h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
           />
        </div>

        {/* Login Form */}
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

          {/* Prompt */}
          <p className="text-stone-200 text-lg font-medium tracking-wide drop-shadow-md mb-1 opacity-90">
            {isBeachMode 
              ? (language === 'en' ? 'Enter Location Code' : 'أدخل رمز الموقع')
              : (language === 'en' ? 'Enter Room / Location Code' : 'أدخل رقم الغرفة / رمز الموقع')
            }
          </p>

          {/* Primary ID Input (Room / Sunbed / Presto) */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/60">
              <KeyRound size={20} />
            </div>
            <input
              type="text"
              placeholder={
                isBeachMode ? 'e.g. SB1, GB5' : 'e.g. 101, P1'
              }
              value={inputRoom}
              onChange={(e) => {
                setInputRoom(e.target.value);
                setRoomError(false);
              }}
              className={`
                 w-full bg-white/10 backdrop-blur-md border-2 rounded-full py-4 px-12 text-white placeholder-white/50 focus:outline-none focus:border-gold/80 text-lg transition-colors
                 ${roomError ? 'border-red-500/80' : 'border-white/20'}
               `}
            />
          </div>

          {/* Phone Number Input - Dynamically hidden if section doesn't require it */}
          {requiresPhone && (
            <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/60">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                placeholder={UI_TEXT.enterPhone[language]}
                value={inputPhone}
                onChange={(e) => {
                  setInputPhone(e.target.value);
                  setPhoneError(false);
                }}
                className={`
                   w-full bg-white/10 backdrop-blur-md border-2 rounded-full py-4 px-12 text-white placeholder-white/50 focus:outline-none focus:border-gold/80 text-lg transition-colors
                   ${phoneError ? 'border-red-500/80' : 'border-white/20'}
                 `}
              />
            </div>
          )}

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
          
          {/* Helpful Hint */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
            {sections
              .filter(s => isBeachMode ? s.menu === 'seashell' : s.menu !== 'seashell')
              .map(s => (
              <span key={s.id} className="text-white/40 text-[10px] uppercase tracking-widest">
                {s.name}: {s.prefix}{s.padLength > 0 ? '1'.padStart(s.padLength, '0') : (s.prefix ? '1' : '101')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative 3D Overlay Effects */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"></div>
    </div>
  );
};

export default LandingPage;
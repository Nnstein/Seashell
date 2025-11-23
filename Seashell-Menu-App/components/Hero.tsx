import React from 'react';
import { Sparkles } from 'lucide-react';
import { Theme, Language } from '../types';
import { UI_TEXT } from '../data';

interface HeroProps {
    activeCategoryName: string;
    theme: Theme;
    language: Language;
}

const Hero: React.FC<HeroProps> = ({ activeCategoryName, theme, language }) => {
  return (
    <section className="relative py-8 sm:py-12 px-4 overflow-hidden min-h-[25vh] sm:min-h-[30vh] flex flex-col justify-center">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className={`inline-flex items-center justify-center p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm border border-white/10 text-white rounded-full mb-4 sm:mb-6 animate-fade-in-up`}>
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-yellow-300" />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{UI_TEXT.experienceTaste[language]}</span>
        </div>
        
        <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-3 sm:mb-4 leading-tight animate-fade-in-up drop-shadow-2xl" style={{ animationDelay: '0.1s' }}>
          {activeCategoryName}
        </h2>
        
        <p className={`text-sm sm:text-lg md:text-xl max-w-2xl mx-auto font-light animate-fade-in-up ${theme.textColor} drop-shadow-md bg-black/20 p-2 rounded-xl backdrop-blur-sm`} style={{ animationDelay: '0.2s' }}>
          {language === 'en' ? 'Curated selection for your enjoyment.' : 'تشكيلة مختارة لمتعتك.'}
        </p>
      </div>
    </section>
  );
};

export default React.memo(Hero);
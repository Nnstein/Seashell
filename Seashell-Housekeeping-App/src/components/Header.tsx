import React from 'react';
import { ClipboardList, LogOut } from 'lucide-react';
import { Theme } from '../types';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  theme: Theme;
}

const Header: React.FC<HeaderProps> = ({ theme }) => {
  const { requestList, setIsRequestOpen, animateRequest, language, roomNumber, setRoomNumber, setView } = useApp();
  const requestCount = requestList.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    setRoomNumber('');
    setView('HOME');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-500 pt-2 sm:pt-4 px-2 sm:px-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto backdrop-blur-md bg-black/30 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Room Number Display / Logout */}
          {roomNumber && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <span className="text-white text-xs font-bold">{UI_TEXT.roomNumber[language]}: {roomNumber}</span>
              <button onClick={handleLogout} className="text-white/70 hover:text-white">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">SEASHELL</h1>
          <p className="text-[8px] sm:text-[10px] font-sans tracking-[0.2em] text-white/70 uppercase">Housekeeping</p>
        </div>

        <button
          onClick={() => setIsRequestOpen(true)}
          className={`relative group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-xl transition-all duration-300 ${theme.accentColor} text-white hover:brightness-110 ${animateRequest ? 'scale-110 ring-4 ring-white/30' : ''}`}
        >
          <span className="font-medium text-xs sm:text-sm hidden sm:block tracking-wide">{UI_TEXT.myRequest[language]}</span>
          <ClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 ${animateRequest ? 'animate-bounce' : ''}`} />
          {requestCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-stone-900 text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shadow-sm">
              {requestCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;

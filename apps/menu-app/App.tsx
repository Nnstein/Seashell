import React from 'react';
import { useApp } from './context/AppContext';
import { useEffect, useState } from 'react';
import { getMenuSettings } from './services/firestoreService';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import ConfirmationScreen from './components/ConfirmationScreen';
import MenuView from './views/MenuView';
import OrderHistoryView from './views/OrderHistoryView';
import PaymentCallback from './components/PaymentCallback';
import { Clock } from 'lucide-react';

function App() {
  const { view, language, activeMenu, roomNumber, menuSettings } = useApp();
  const [menuIsOpen, setMenuIsOpen] = useState(true);
  const [closeMessage, setCloseMessage] = useState(''); 
  const [checkingMenuStatus, setCheckingMenuStatus] = useState(true);

  // Sync menu status from real-time AppContext
  useEffect(() => {
    if (menuSettings) {
      // Support both new independent status and legacy global status
      const currentMenuStatus = menuSettings.menuStatus?.[activeMenu];
      
      if (currentMenuStatus) {
          setMenuIsOpen(currentMenuStatus.isOpen);
          setCloseMessage(currentMenuStatus.closeMessage || '');
      } else {
          // Fallback to legacy
          setMenuIsOpen(menuSettings.menuOpen ?? true);
          setCloseMessage(menuSettings.closeMessage || '');
      }
      setCheckingMenuStatus(false);
    }
  }, [menuSettings, activeMenu]);

  const normalizedPathname = window.location.pathname.replace(/\/+/g, '/');
  const isBeachMode = normalizedPathname.startsWith('/beach');
  const isHome = normalizedPathname === '/' || normalizedPathname === '/beach';
  const isPaymentCallback = normalizedPathname === '/payment-callback';

  // --- STRICT ROUTING LOGIC ---
  // 1. If the path is not one of our official routes, it's invalid.
  const isValidRoute = isHome || isPaymentCallback;
  
  // 2. We only show the MENU if the route is valid AND we have a room number
  const effectiveView = (isValidRoute && roomNumber) ? view : 'HOME';

  // If on payment callback, render it directly without Layout
  if (isPaymentCallback) {
    return <PaymentCallback />;
  }

  // Show loading while checking menu status
  if (checkingMenuStatus) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      </Layout>
    );
  }

  let content;
  switch (effectiveView) {
    case 'HOME':
      content = <LandingPage isBeachMode={isBeachMode} />;
      break;
    case 'MENU':
      content = <MenuView />;
      break;
    case 'CONFIRMATION':
      content = <ConfirmationScreen />;
      break;
    case 'ORDER_HISTORY':
      content = <OrderHistoryView />;
      break;
    default:
      content = <LandingPage isBeachMode={isBeachMode} />;
  }

  const isRTL = language === 'ar';
  
  // Default fallback messages if manager hasn't set a custom one
  const defaultMessage = language === 'ar'
    ? 'نعتذر، القائمة مغلقة مؤقتاً. يرجى المحاولة مرة أخرى لاحقاً.'
    : 'We apologize, our menu is temporarily closed. Please try again later.';

  return (
    <Layout>
      {/* Menu Content (always shown) */}
      {content}

      {/* Closed Menu Modal Overlay - Shows after login */}
      {!menuIsOpen && view === 'MENU' && (
        <>
          {/* Backdrop to prevent interaction */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
          
          {/* Custom Close Message Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl p-8 md:p-12 border-4 border-amber-200 animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-500 text-white mb-6 shadow-lg mx-auto">
                  <Clock size={48} />
                </div>
                
                {/* Heading - Bilingual */}
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-800 mb-2 text-center">
                  {language === 'ar' ? 'مغلق مؤقتاً' : 'Temporarily Closed'}
                </h2>
                
                {/* Manager's Custom Message - Always in English */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-inner mb-6">
                  <p className="text-stone-700 text-base md:text-lg leading-relaxed text-center whitespace-pre-wrap">
                    {closeMessage || defaultMessage}
                  </p>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 md:p-6">
                  <p className="text-sm text-stone-500 mb-2 text-center">
                    {language === 'ar' ? 'نقدر صبركم' : 'We appreciate your patience'}
                  </p>
                  <p className="text-xl md:text-2xl font-serif font-bold text-amber-600 text-center">
                    {language === 'ar' ? 'شكراً لتفهمكم' : 'Thank you for your understanding'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default App;
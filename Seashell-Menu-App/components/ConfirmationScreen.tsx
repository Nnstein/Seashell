import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';

const ConfirmationScreen: React.FC = () => {
  const { confirmedOrder, resetOrder, language, roomNumber, clearCart } = useApp();
  const total = confirmedOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isRTL = language === 'ar';

  // Clear the active cart when this screen mounts.
  // This ensures the transition happens smoothly before we wipe the cart state.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white text-green-600 mb-6 shadow-lg animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h2 className="font-serif text-5xl font-bold text-white mb-6 drop-shadow-lg">{UI_TEXT.orderReceived[language]}</h2>
        <p className="text-stone-200 text-xl font-sans max-w-lg mx-auto font-light leading-relaxed drop-shadow-md">
          {UI_TEXT.orderMsg[language]}
        </p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-100 relative">
        {/* Decorative top border */}
        <div className="h-2 bg-gradient-to-r from-stone-800 via-gold to-stone-800"></div>

        <div className="bg-stone-50 px-10 py-8 flex justify-between items-center border-b border-stone-200">
          <h3 className="text-stone-800 font-serif text-2xl font-bold">{UI_TEXT.receipt[language]}</h3>
          <div className="text-right">
            <p className="text-stone-400 text-xs uppercase tracking-widest">{UI_TEXT.roomNumber[language]}</p>
            <p className="text-stone-900 font-mono text-2xl font-bold">{roomNumber}</p>
          </div>
        </div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <h4 className="text-stone-400 text-xs uppercase tracking-widest mb-4">{UI_TEXT.itemsOrdered[language]}</h4>
                {confirmedOrder.map((item) => (
                    <div key={item.cartId} className="flex gap-4 items-center border-b border-stone-100 pb-4 last:border-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                            <img src={item.image} alt={item.name[language]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h4 className="font-serif text-lg font-bold text-stone-800">{item.name[language]}</h4>
                                <span className="text-stone-600 font-medium">{(item.price * item.quantity).toFixed(3)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-0.5 rounded-full">Qty: {item.quantity}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-stone-900 rounded-2xl p-8 flex flex-col justify-between h-full text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4 text-stone-300">
                        <span>{UI_TEXT.subtotal[language]}</span>
                        <span>{total.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-8 text-stone-300">
                        <span>{UI_TEXT.serviceCharge[language]}</span>
                        <span>0.000</span>
                    </div>
                    <div className="border-t border-stone-700 pt-6 flex justify-between items-end">
                        <span className="font-serif text-2xl font-bold text-gold">{UI_TEXT.totalPaid[language]}</span>
                        <span className="font-sans text-4xl font-bold text-white">{total.toFixed(3)} <span className="text-lg font-normal text-stone-400">KWD</span></span>
                    </div>
                </div>
                
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
        </div>
        
        <div className="bg-stone-50 p-8 text-center border-t border-stone-200">
             <button onClick={resetOrder} className="inline-flex items-center justify-center px-8 py-3 border border-stone-300 shadow-sm text-sm font-medium rounded-full text-stone-700 bg-white hover:bg-stone-50 transition-all hover:border-gold hover:text-gold">
                {UI_TEXT.startNew[language]}
             </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;
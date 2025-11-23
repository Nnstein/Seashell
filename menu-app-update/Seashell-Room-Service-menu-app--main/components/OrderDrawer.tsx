import React from 'react';
import { X, Plus, Minus, Trash2, ChevronRight, ChevronLeft, ClipboardList, Home } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';

interface OrderDrawerProps {
  // Props are now optional or removed in favor of context
}

const OrderDrawer: React.FC<OrderDrawerProps> = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateQuantity, 
    removeFromCart, 
    handleCheckout, 
    language,
    roomNumber
  } = useApp();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isRTL = language === 'ar';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full sm:w-[450px] bg-[#fdfbf7] z-50 shadow-2xl transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${
          isCartOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-stone-200 bg-white/50 relative z-20 flex justify-between items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-stone-800 flex items-center gap-2">
                {UI_TEXT.myOrder[language]}
              </h2>
              {/* Room Number Display */}
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs font-bold tracking-wider uppercase text-stone-400">{UI_TEXT.roomNumber[language]}:</span>
                 <span className="text-sm font-sans font-bold text-gold bg-stone-900 px-2 py-0.5 rounded">{roomNumber}</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsCartOpen(false)} 
              className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-grow overflow-y-auto px-8 py-6 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                    <ClipboardList size={40} className="opacity-40" />
                </div>
                <p className="font-serif text-2xl text-stone-600">{UI_TEXT.yourOrderEmpty[language]}</p>
                <p className="font-sans text-sm mt-2 max-w-[200px] text-center">{UI_TEXT.exploreMenu[language]}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex gap-4 items-start group animate-fade-in bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 shadow-sm">
                      <img src={item.image} alt={item.name[language]} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight">{item.name[language]}</h3>
                        <p className={`font-sans font-bold text-stone-900 ${isRTL ? 'mr-2' : 'ml-2'}`}>{(item.price * item.quantity).toFixed(3)}</p>
                      </div>
                      <p className="font-sans text-xs text-stone-500 mb-3 truncate max-w-[180px]">{item.description ? item.description[language] : ''}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-stone-100 rounded-lg h-8">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className={`w-8 h-full flex items-center justify-center hover:bg-stone-200 text-stone-600 ${isRTL ? 'rounded-r-lg' : 'rounded-l-lg'} transition-colors`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-sans text-sm font-bold text-stone-800">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className={`w-8 h-full flex items-center justify-center hover:bg-stone-200 text-stone-600 ${isRTL ? 'rounded-l-lg' : 'rounded-r-lg'} transition-colors`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Checkout */}
          {cart.length > 0 && (
            <div className="px-8 py-6 bg-white border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-20">
              <div className="flex justify-between items-end mb-6">
                <div>
                   <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">{UI_TEXT.total[language]}</p>
                   <span className="font-serif text-stone-900 text-3xl font-bold">{total.toFixed(3)} <span className="text-sm font-sans font-normal text-stone-400">KWD</span></span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCheckout();
                }}
                className="w-full bg-stone-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:bg-gold hover:text-white hover:shadow-gold/20 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
              >
                {UI_TEXT.placeOrder[language]} {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderDrawer;
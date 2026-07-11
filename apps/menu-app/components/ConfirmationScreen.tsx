import React, { useEffect } from 'react';
import { CheckCircle, Tag } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';
import { getRandomPrepTimeMessage, getPrepTimeLabel } from '../utils/preparationTimeMessages';

const ConfirmationScreen: React.FC = () => {
  const { confirmedOrder, resetOrder, language, roomNumber, clearCart, expectedPreparationTime } = useApp();

  // Use effectiveTotal for actual paid amount
  const total = confirmedOrder.reduce((sum, item) =>
    sum + (item.effectiveTotal ?? item.price * item.quantity), 0
  );
  const totalSavings = confirmedOrder.reduce((sum, item) => sum + (item.savings ?? 0), 0);
  const isRTL = language === 'ar';

  // Generate a personalized prep time message
  const prepTimeMessage = getRandomPrepTimeMessage(expectedPreparationTime, language);

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
        {/* Expected Preparation Time - Dynamic Message */}
        <div className="mt-8 inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform">
          <p className="text-sm font-medium uppercase tracking-widest mb-1 opacity-90">
            {getPrepTimeLabel(language)}
          </p>
          <p className="text-2xl md:text-3xl font-bold font-serif leading-tight">
            {prepTimeMessage[language]}
          </p>
        </div>
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
              <div key={item.cartId} className="flex gap-4 items-start border-b border-stone-100 pb-4 last:border-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                  <img src={item.image} alt={typeof item.name === 'object' ? item.name[language] : item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-serif text-lg font-bold text-stone-800">
                      {typeof item.name === 'object' ? item.name[language] : item.name}
                    </h4>
                    {/* Price display with discount/bundle */}
                    <div className="text-right">
                      {item.savings != null && item.savings > 0.01 ? (
                        <>
                          <span className="text-xs text-stone-400 line-through block">
                            {(item.originalTotal ?? item.price * item.quantity).toFixed(3)}
                          </span>
                          <span className={`font-medium ${item.hasBundlePricing ? 'text-purple-600' : 'text-red-600'}`}>
                            {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)}
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-600 font-medium">
                          {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-0.5 rounded-full">Qty: {item.quantity}</span>
                    {item.selectedSize && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{item.selectedSize}</span>
                    )}
                    {/* Bundle/Discount badges */}
                    {item.hasBundlePricing && item.appliedBundle && (
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag size={10} /> {item.appliedBundle.quantity}x Bundle
                      </span>
                    )}
                    {item.hasDiscount && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        🏷️ Discounted
                      </span>
                    )}
                    {item.savings != null && item.savings > 0.01 && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        -{item.savings.toFixed(3)} KD
                      </span>
                    )}
                  </div>
                  {/* Addons Display */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="mt-2 text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded border-l-2 border-teal-400">
                      <span className="font-semibold">➕ Add-ons:</span> {item.selectedAddons.join(', ')}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="mt-2 text-xs italic text-amber-700 bg-amber-50 px-2 py-1 rounded border-l-2 border-amber-400">
                      📝 {item.specialInstructions}
                    </div>
                  )}
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
              {totalSavings > 0.01 && (
                <div className="flex justify-between items-center mb-4 text-green-400">
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    {language === 'ar' ? 'التوفير' : 'You Saved'}
                  </span>
                  <span className="font-bold">-{totalSavings.toFixed(3)}</span>
                </div>
              )}
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
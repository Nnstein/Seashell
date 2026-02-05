import React, { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ChevronRight, ChevronLeft, ClipboardList, Home, Loader2, Clock } from 'lucide-react';
import { UI_TEXT } from '../data';
import { useApp } from '../context/AppContext';
import { CartItem } from '../context/AppContext';
import { getPendingOrdersCount, calculatePreparationTime } from '../services/firestoreService';
import { getRandomPrepTimeMessage } from '../utils/preparationTimeMessages';

interface OrderDrawerProps {
  // Props are now optional or removed in favor of context
}

const OrderDrawer: React.FC<OrderDrawerProps> = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    updateInstructions,
    removeFromCart,
    handleCheckout,
    language,
    roomNumber,
    isPlacingOrder,
    chairNumber,
    setChairNumber,
    isBeachGuest
  } = useApp();

  // Use effectiveTotal which already includes discount/bundle pricing
  const total = cart.reduce((sum, item) => sum + (item.effectiveTotal ?? item.price * item.quantity), 0);
  const totalSavings = cart.reduce((sum, item) => sum + (item.savings ?? 0), 0);
  const isRTL = language === 'ar';
  const [paymentMethod, setPaymentMethod] = React.useState<'room_charge' | 'card'>('room_charge');
  const [estimatedPrepTime, setEstimatedPrepTime] = React.useState<number>(30);
  const [loadingPrepTime, setLoadingPrepTime] = React.useState(false);

  // Fetch estimated prep time when drawer opens or cart changes
  useEffect(() => {
    const fetchPrepTime = async () => {
      if (cart.length > 0 && isCartOpen) {
        setLoadingPrepTime(true);
        try {
          const pendingCount = await getPendingOrdersCount();
          const prepTime = calculatePreparationTime(pendingCount);
          setEstimatedPrepTime(prepTime);
        } catch (error) {
          console.error('Error fetching prep time:', error);
        } finally {
          setLoadingPrepTime(false);
        }
      }
    };
    
    fetchPrepTime();
  }, [cart.length, isCartOpen]);

  const getName = (item: CartItem) => {
    if (typeof item.name === 'object' && item.name !== null) {
      return (item.name as any)[language] || (item.name as any)['en'] || '';
    }
    return item.name;
  };

  const getDescription = (item: CartItem) => {
    if (typeof item.description === 'object' && item.description !== null) {
      return (item.description as any)[language] || (item.description as any)['en'] || '';
    }
    return item.description;
  };

  const getImage = (item: CartItem) => {
    return item.imageUrl || item.image || `https://source.unsplash.com/featured/?food,${item.category}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full sm:w-[450px] bg-[#fdfbf7] z-50 shadow-2xl transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isCartOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')
          }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-stone-200 bg-white/50 relative z-20 flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-800 flex items-center gap-2 truncate">
                {UI_TEXT.myOrder[language]}
              </h2>
              {/* Room/Beach Number Display */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold tracking-wider uppercase text-stone-400">
                  {isBeachGuest
                    ? (language === 'ar' ? 'رقم الشاطئ' : 'Beach Number')
                    : UI_TEXT.roomNumber[language]
                  }:
                </span>
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
          <div className="flex-grow overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <ClipboardList size={32} className="opacity-40 sm:hidden" />
                  <ClipboardList size={40} className="opacity-40 hidden sm:block" />
                </div>
                <p className="font-serif text-xl sm:text-2xl text-stone-600 text-center">{UI_TEXT.yourOrderEmpty[language]}</p>
                <p className="font-sans text-xs sm:text-sm mt-2 max-w-[200px] text-center">{UI_TEXT.exploreMenu[language]}</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex gap-3 sm:gap-4 items-start group animate-fade-in bg-white p-2 sm:p-3 rounded-xl border border-stone-100 shadow-sm">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 shadow-sm">
                      <img src={getImage(item)} alt={getName(item)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight">{getName(item)}</h3>
                        <div className={`${isRTL ? 'mr-2' : 'ml-2'} text-right`}>
                          {/* Show savings if bundle/discount applied */}
                          {item.savings && item.savings > 0.01 && (
                            <span className="text-xs text-stone-400 line-through block">
                              {(item.originalTotal ?? item.price * item.quantity).toFixed(3)}
                            </span>
                          )}
                          <span className={`font-sans font-bold ${item.hasBundlePricing ? 'text-purple-600' : item.hasDiscount ? 'text-red-600' : 'text-stone-900'}`}>
                            {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <p className="font-sans text-xs text-stone-500 mb-1 truncate max-w-[180px]">{getDescription(item)}</p>

                      {/* Bundle/Discount Badge */}
                      {(item.hasBundlePricing || item.hasDiscount) && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.hasBundlePricing && item.appliedBundle && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              📦 {item.appliedBundle.quantity}x Bundle
                            </span>
                          )}
                          {item.hasDiscount && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              🏷️ Discounted
                            </span>
                          )}
                          {item.savings && item.savings > 0.01 && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              -{item.savings.toFixed(3)} KD
                            </span>
                          )}
                        </div>
                      )}

                      {/* Customizations Display */}
                      {(item.selectedSize || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                        <div className="mb-2 text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-100">
                          {item.selectedSize && (
                            <div className="flex gap-1">
                              <span className="font-bold">Size:</span>
                              <span>{item.selectedSize}</span>
                            </div>
                          )}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              <span className="font-bold">Add-ons:</span>
                              <span>{item.selectedAddons.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Special Instructions */}
                      <div className="mb-3">
                        <textarea
                          placeholder={language === 'ar' ? 'تعليمات خاصة...' : 'Special instructions...'}
                          value={item.specialInstructions || ''}
                          onChange={(e) => updateInstructions(item.cartId, e.target.value)}
                          className="w-full text-xs p-2 border border-stone-200 rounded bg-white text-stone-900 placeholder:text-stone-400 focus:border-gold focus:ring-0 outline-none resize-none"
                          rows={2}
                        />
                      </div>

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
            <div className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-20">
              <div className="flex justify-between items-end mb-4 sm:mb-6">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 mb-1">{UI_TEXT.total[language]}</p>
                  <span className="font-serif text-stone-900 text-2xl sm:text-3xl font-bold">{total.toFixed(3)} <span className="text-xs sm:text-sm font-sans font-normal text-stone-400">KWD</span></span>
                </div>
              </div>

              {/* Estimated Preparation Time Display */}
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                    {loadingPrepTime ? (
                      <Loader2 className="animate-spin text-white" size={20} />
                    ) : (
                      <Clock className="text-white" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1">
                      {language === 'ar' ? 'الوقت المقدر' : 'Estimated Delivery'}
                    </p>
                    {loadingPrepTime ? (
                      <p className="text-sm text-amber-600 animate-pulse">
                        {language === 'ar' ? 'جاري الحساب...' : 'Calculating...'}
                      </p>
                    ) : (
                      <p className="text-base sm:text-lg font-bold text-stone-800 leading-tight">
                        {getRandomPrepTimeMessage(estimatedPrepTime, language)[language]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <label className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${paymentMethod === 'room_charge' ? 'border-gold bg-gold/10 text-stone-900 shadow-md' : 'border-stone-100 bg-stone-50 text-stone-400 hover:border-gold/50 hover:bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="room_charge"
                      checked={paymentMethod === 'room_charge'}
                      onChange={() => setPaymentMethod('room_charge')}
                      className="hidden"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent opacity-0 transition-opacity duration-500 ${paymentMethod === 'room_charge' ? 'opacity-100' : ''}`} />
                    <Home size={24} className={`sm:w-7 sm:h-7 mb-1 sm:mb-2 z-10 transition-transform duration-300 ${paymentMethod === 'room_charge' ? 'scale-110 text-gold' : 'group-hover:scale-110'}`} />
                    <span className="font-serif font-bold text-xs sm:text-sm z-10">Room Charge</span>
                    <span className="text-[8px] sm:text-[10px] uppercase tracking-wider opacity-60 z-10">Bill to Room</span>
                  </label>

                  <label className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${paymentMethod === 'card' ? 'border-stone-800 bg-stone-800 text-white shadow-md' : 'border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-800/50 hover:bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="hidden"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 ${paymentMethod === 'card' ? 'opacity-100' : ''}`} />
                    <div className="mb-1 sm:mb-2 z-10">
                      {/* Custom Card Icon or Lucide */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`sm:w-7 sm:h-7 transition-transform duration-300 ${paymentMethod === 'card' ? 'scale-110' : 'group-hover:scale-110'}`}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    </div>
                    <span className="font-serif font-bold text-xs sm:text-sm z-10">Pay with Card</span>
                    <span className="text-[8px] sm:text-[10px] uppercase tracking-wider opacity-60 z-10">Credit / Debit</span>
                  </label>
                </div>
              </div>



              {/* ... inside component ... */}

              {/* Beach Guest: Chair Number Input */}
              {isBeachGuest && (
                <div className="mb-6 space-y-2 animate-fade-in">
                  <label className="text-xs uppercase tracking-widest text-stone-500">
                    {language === 'ar' ? 'رقم الكرسي / الطاولة' : 'Chair / Table Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chairNumber}
                    onChange={(e) => setChairNumber(e.target.value.toUpperCase())}
                    placeholder={language === 'ar' ? 'مثال: C12' : 'e.g. C12'}
                    className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl focus:border-gold focus:ring-0 outline-none font-mono text-lg font-bold text-stone-900 placeholder:text-stone-300 transition-colors"
                  />
                  <p className="text-[10px] text-stone-400">
                    {language === 'ar' ? 'يرجى إدخال الرقم الموجود على الكرسي أو الطاولة.' : 'Please enter the number tag found on your chair or table.'}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isPlacingOrder) handleCheckout(paymentMethod);
                }}
                disabled={isPlacingOrder || (isBeachGuest && !chairNumber)}
                className={`w-full bg-stone-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:bg-gold hover:text-white hover:shadow-gold/20 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 ${isPlacingOrder || (isBeachGuest && !chairNumber) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {UI_TEXT.placeOrder[language]} {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderDrawer;
import React from 'react';
import { X, Minus, Plus, Trash2, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UI_TEXT } from '../data';

const RequestDrawer: React.FC = () => {
    const {
        isRequestOpen,
        setIsRequestOpen,
        requestList,
        updateQuantity,
        removeFromRequest,
        submitRequest,
        isSubmitting,
        language
    } = useApp();

    const isRTL = language === 'ar';

    if (!isRequestOpen) return null;

    const getName = (name: string | { en: string; ar: string }) => {
        if (typeof name === 'object' && name !== null) {
            return (name as any)[language] || (name as any)['en'] || '';
        }
        return name;
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                onClick={() => setIsRequestOpen(false)}
            ></div>

            {/* Drawer */}
            <div className={`
        pointer-events-auto w-full max-w-md bg-paper h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out
        ${isRequestOpen ? 'translate-x-0' : 'translate-x-full'}
      `} dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="p-4 sm:p-6 bg-white border-b border-stone-200 flex items-center justify-between shadow-sm z-10">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">{UI_TEXT.myRequest[language]}</h2>
                    <button
                        onClick={() => setIsRequestOpen(false)}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {requestList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
                            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                                <Send size={32} />
                            </div>
                            <p className="text-lg font-medium">{UI_TEXT.yourRequestEmpty[language]}</p>
                        </div>
                    ) : (
                        requestList.map((item) => (
                            <div key={item.itemId} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex gap-4 animate-fade-in-up">
                                <div className="flex-1">
                                    <h3 className="font-bold text-stone-900 mb-1">{getName(item.name)}</h3>

                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center bg-stone-100 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.itemId, -1)}
                                                className="p-1 hover:bg-white rounded-md transition-shadow text-stone-600"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.itemId, 1)}
                                                className="p-1 hover:bg-white rounded-md transition-shadow text-stone-600"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromRequest(item.itemId)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
                    <button
                        onClick={submitRequest}
                        disabled={requestList.length === 0 || isSubmitting}
                        className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
              ${requestList.length === 0
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : 'bg-gold text-white hover:bg-gold/90 hover:shadow-gold/30 active:scale-95'}
            `}
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{UI_TEXT.confirmRequest[language]}</span>
                                <Send size={20} className={isRTL ? 'rotate-180' : ''} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestDrawer;

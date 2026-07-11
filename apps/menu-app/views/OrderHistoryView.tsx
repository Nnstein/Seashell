import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ClipboardList, Calendar, CreditCard, Package, AlertCircle, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { GuestOrderHistoryItem, PaymentStatus } from '../src/types';

const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode; arLabel: string }> = {
  success: {
    label: 'Paid',
    arLabel: 'تم الدفع',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />
  },
  failed: {
    label: 'Payment Failed',
    arLabel: 'فشل الدفع',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />
  },
  pending: {
    label: 'Awaiting Payment',
    arLabel: 'في انتظار الدفع',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />
  },
  cancelled: {
    label: 'Cancelled',
    arLabel: 'ملغى',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <XCircle className="w-3.5 h-3.5" />
  },
  unknown: {
    label: 'Unknown',
    arLabel: 'غير معروف',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />
  }
};

const ORDER_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  preparing: { en: 'Preparing', ar: 'يتم التحضير' },
  ready: { en: 'Ready', ar: 'جاهز' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
  awaiting_payment: { en: 'Awaiting Payment', ar: 'في انتظار الدفع' }
};

function formatDate(timestamp: number, language: 'en' | 'ar'): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(3)} KWD`;
}

const OrderCard: React.FC<{ order: GuestOrderHistoryItem; language: 'en' | 'ar' }> = ({ order, language }) => {
  const isRTL = language === 'ar';
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] || PAYMENT_STATUS_META.unknown;
  const statusLabel = ORDER_STATUS_LABELS[order.status] || { en: order.status, ar: order.status };

  const itemNames = order.items.map(item => {
    const name = typeof item.name === 'object' ? item.name[language] || item.name.en : item.name;
    return `${name} x${item.quantity}`;
  }).join(', ');

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sm:p-5 transition-all hover:shadow-md ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header Row: Date + Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-stone-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(order.createdAt, language)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payment Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${paymentMeta.color}`}>
            {paymentMeta.icon}
            {isRTL ? paymentMeta.arLabel : paymentMeta.label}
          </span>
          {/* Order Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-stone-50 text-stone-600 border-stone-200`}>
            <Package className="w-3.5 h-3.5" />
            {isRTL ? statusLabel.ar : statusLabel.en}
          </span>
        </div>
      </div>

      {/* Items Summary */}
      <div className="mb-3">
        <p className="text-stone-700 text-sm leading-relaxed line-clamp-2">
          {itemNames}
        </p>
      </div>

      {/* Footer Row: Total + Transaction ID if available */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2 text-stone-800">
          <CreditCard className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</span>
        </div>
        {order.paymentDetails?.transactionId && typeof order.paymentDetails.transactionId === 'string' && (
          <span className="text-[11px] text-stone-400 font-mono truncate max-w-[140px]">
            TX: {order.paymentDetails.transactionId}
          </span>
        )}
      </div>
    </div>
  );
};

const OrderHistoryView: React.FC = () => {
  const { language, orderHistory, loadingOrderHistory, fetchOrderHistory, setView, roomNumber, phoneNumber, isBeachGuest } = useApp();
  const isRTL = language === 'ar';

  useEffect(() => {
    fetchOrderHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`min-h-screen pt-20 sm:pt-24 pb-10 px-3 sm:px-6 max-w-3xl mx-auto ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('MENU')}
          className="p-2 rounded-full hover:bg-white/20 bg-black/5 transition-colors"
        >
          {isRTL ? <span className="text-xl">→</span> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
            {isRTL ? 'سجل الطلبات' : 'Order History'}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {isBeachGuest 
              ? (isRTL 
                  ? `رقم الهاتف: ${phoneNumber} · سرير الشمس: ${roomNumber.replace('SB', '')} · آخر 6 أشهر` 
                  : `Phone: ${phoneNumber} · Sunbed: ${roomNumber.replace('SB', '')} · Last 6 months`)
              : (isRTL 
                  ? `رقم الهاتف: ${phoneNumber} · الغرفة: ${roomNumber} · آخر 6 أشهر` 
                  : `Phone: ${phoneNumber} · Room: ${roomNumber} · Last 6 months`)
            }
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loadingOrderHistory && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-stone-500 text-sm">
            {isRTL ? 'جاري تحميل السجل...' : 'Loading your orders...'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loadingOrderHistory && orderHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-1">
            {isRTL ? 'لا توجد طلبات' : 'No orders yet'}
          </h3>
          <p className="text-sm text-stone-500 max-w-xs">
            {isRTL
              ? 'لم نعثر على أي طلبات حديثة لمجموعة الغرفة/رقم الهاتف هذه.'
              : 'We couldn\'t find any recent orders for this room/phone combination.'}
          </p>
        </div>
      )}

      {/* Order List */}
      {!loadingOrderHistory && orderHistory.length > 0 && (
        <div className="space-y-4">
          {orderHistory.map(order => (
            <OrderCard key={order.id} order={order} language={language} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryView;

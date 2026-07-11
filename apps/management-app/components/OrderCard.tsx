import React from 'react';
import { Order } from '../src/types';
import { Clock, MapPin, CheckCircle, ChefHat, Truck, Phone, Star, Edit3 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onToggleVIP?: (orderId: string, currentVIPStatus: boolean) => void;
  onEditItems?: (order: Order) => void;
  onViewDetails?: (order: Order) => void;
  userRole: 'admin' | 'kitchen' | 'seashell' | 'presto' | 'room-service';
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, onToggleVIP, onEditItems, onViewDetails, userRole }) => {
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    switch (current) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      case 'delivered': return 'completed';
      case 'completed': return null;
      default: return null;
    }
  };

  const formatExactTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const nextStatus = getNextStatus(order.status);
  const orderTime = typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt 
    ? (order.createdAt as any).seconds * 1000 
    : typeof order.createdAt === 'number' ? order.createdAt : Date.now();

  return (
    <div 
      className={`bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden fade-in-up ${onViewDetails ? 'cursor-pointer' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (onViewDetails) onViewDetails(order);
      }}
    >
      {/* VIP Ribbon */}
      {order.isVIP && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-yellow-500 text-white px-3 py-1 shadow-lg transform translate-x-2 -translate-y-0.5 rotate-12">
          <div className="flex items-center gap-1">
            <Star size={12} fill="white" />
            <span className="text-[10px] font-black uppercase tracking-wider">VIP</span>
          </div>
        </div>
      )}

      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full 
        ${order.status === 'pending' ? 'bg-blue-500' : ''}
        ${order.status === 'preparing' ? 'bg-amber-500' : ''}
        ${order.status === 'ready' ? 'bg-emerald-500' : ''}
        ${order.status === 'delivered' ? 'bg-purple-500' : ''}
        ${order.status === 'completed' ? 'bg-slate-300' : ''}
        ${order.status === 'cancelled' ? 'bg-red-500' : ''}
      `}></div>

      {/* Massive LATE PAYMENT Warning */}
      {order.isLatePayment && order.status === 'pending' && (
        <div className="bg-red-100 border-l-4 border-red-600 p-3 mb-4 rounded-r-lg shadow-sm animate-pulse">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-red-800 font-bold text-xs uppercase tracking-widest">Late Payment Detected</h4>
              <p className="text-red-700 text-[11px] mt-0.5 leading-tight">
                Money was captured hours after the order was placed. <strong>DO NOT COOK.</strong> Needs Refund.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="mr-2">#{order.id.slice(0, 6)}</span>
              <Clock size={12} className="mr-1" />
              {timeAgo(orderTime)}
            </div>
            {/* VIP Toggle Star - Only for Admin */}
            {userRole === 'admin' && onToggleVIP && (
              <button
                onClick={() => onToggleVIP(order.id, order.isVIP || false)}
                className={`p-1 rounded-full transition-all duration-200 ${
                  order.isVIP 
                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' 
                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                }`}
                title={order.isVIP ? 'Remove VIP status' : 'Mark as VIP'}
              >
                <Star size={16} fill={order.isVIP ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block w-fit">
            {formatExactTime(orderTime)}
          </div>
        </div>
        <div className="font-serif font-bold text-lg text-ink">{order.totalAmount.toFixed(3)} KD</div>
      </div>

      <div className="mb-4 pl-2 pb-4 border-b border-dashed border-slate-200">
        <div className="font-serif text-xl font-bold text-ink mb-1">{order.guestName || 'Guest'}</div>
        <div className="flex items-center text-slate-500 text-sm font-medium mb-1">
          <MapPin size={14} className="mr-1 text-gold" />
          {order.chairNumber ? `Sunbed ${order.chairNumber}` : `Room ${order.roomNumber}`}
        </div>
        {order.phoneNumber && (
          <div className="flex items-center text-slate-500 text-sm font-medium mb-1">
            <Phone size={14} className="mr-1 text-gold" />
            {order.phoneNumber}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${order.paymentMethod === 'card'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
            {'Card Payment'}
          </span>
          {order.menu && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              order.menu === 'room-service' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : order.menu === 'seashell'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
              {order.menu === 'room-service' ? 'RoomSVC' : order.menu === 'seashell' ? 'Seashell' : 'Presto'}
            </span>
          )}
        </div>
      </div>

      <div className="pl-2 space-y-2 mb-4">
        {order.items.map((item, idx) => {
          const itemName = typeof item.name === 'object' && item.name !== null
            ? (item.name as any)['en'] || 'Unknown Item'
            : item.name;

          const itemNotes = (item as any).notes || (item as any).specialInstructions || '';

          return (
            <div key={idx} className="text-sm text-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium">
                    <span className="text-ink font-bold mr-1">{item.quantity}x</span> {itemName}
                  </span>
                  {(item.hasBundlePricing || item.hasDiscount) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.hasBundlePricing && item.appliedBundle && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          📦 {item.appliedBundle.quantity}x Bundle
                        </span>
                      )}
                      {item.hasDiscount && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🏷️ Discount
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right ml-2 font-medium text-slate-600">
                  {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)}
                </div>
              </div>
              {item.selectedSize && (
                <div className="ml-6 mt-1 text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border-l-4 border-blue-400">
                  <span className="font-semibold">📏 Size:</span> {item.selectedSize}
                </div>
              )}
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="ml-6 mt-1 text-xs text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border-l-4 border-teal-400">
                  <span className="font-semibold">➕ Add-ons:</span> {item.selectedAddons.join(', ')}
                </div>
              )}
              {itemNotes && (
                <div className="ml-6 mt-1 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border-l-4 border-amber-400 break-words">
                  <span className="font-semibold text-amber-600">📝 Note:</span> {itemNotes}
                </div>
              )}
            </div>
          );
        })}
        
      </div>

      <div className="pl-2 mt-auto">
        {nextStatus && (userRole === 'admin' || userRole === 'seashell' || userRole === 'presto' || userRole === 'room-service') && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus)}
            className={`w-full flex items-center justify-center py-3 text-xs font-bold uppercase tracking-widest transition-colors border
                    ${order.status === 'pending' ? 'bg-ink text-white hover:bg-blue-900 border-ink' : ''}
                    ${order.status === 'preparing' ? 'bg-white text-amber-600 border-amber-600 hover:bg-amber-50' : ''}
                    ${order.status === 'ready' ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600' : ''}
                    ${order.status === 'delivered' ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-600' : ''}
                `}
          >
            {order.status === 'pending' && <><ChefHat size={14} className="mr-2" /> Start Cooking</>}
            {order.status === 'preparing' && <><CheckCircle size={14} className="mr-2" /> Mark Ready</>}
            {order.status === 'ready' && <><Truck size={14} className="mr-2" /> Deliver</>}
            {order.status === 'delivered' && <><CheckCircle size={14} className="mr-2" /> Complete</>}
          </button>
        )}
        {/* Edit Items — completed orders only, for admin/outlet staff */}
        {order.status === 'completed' && onEditItems && userRole !== 'kitchen' && (
          <button
            onClick={() => onEditItems(order)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[9px] font-medium text-slate-300 hover:text-slate-400 transition-colors rounded-b bg-transparent"
          >
            <Edit3 size={10} /> edit
          </button>
        )}
        {nextStatus && userRole === 'kitchen' && (
          <div className="bg-slate-50 text-slate-400 py-3 text-[10px] font-bold uppercase tracking-widest border border-slate-100 flex items-center justify-center gap-2 italic">
            <Clock size={12} /> View Only
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="text-center text-xs text-slate-300 font-bold uppercase tracking-widest py-2">
            Cancelled
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;

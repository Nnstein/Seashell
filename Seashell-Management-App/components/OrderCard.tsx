import React from 'react';
import { Order } from '../src/types';
import { Clock, MapPin, CheckCircle, ChefHat, Truck, Phone } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: Order['status']) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
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

  const nextStatus = getNextStatus(order.status);
  const orderTime = order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now();

  return (
    <div className="bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden fade-in-up">
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full 
        ${order.status === 'pending' ? 'bg-blue-500' : ''}
        ${order.status === 'preparing' ? 'bg-amber-500' : ''}
        ${order.status === 'ready' ? 'bg-emerald-500' : ''}
        ${order.status === 'delivered' ? 'bg-purple-500' : ''}
        ${order.status === 'completed' ? 'bg-slate-300' : ''}
        ${order.status === 'cancelled' ? 'bg-red-500' : ''}
      `}></div>

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex items-center text-xs font-bold tracking-widest text-slate-400 uppercase">
          <span className="mr-2">#{order.id.slice(0, 6)}</span>
          <Clock size={12} className="mr-1" />
          {timeAgo(orderTime)}
        </div>
        <div className="font-serif font-bold text-lg text-ink">{order.totalAmount.toFixed(3)} KD</div>
      </div>

      <div className="mb-4 pl-2 pb-4 border-b border-dashed border-slate-200">
        <div className="font-serif text-xl font-bold text-ink mb-1">{order.guestName || 'Guest'}</div>
        <div className="flex items-center text-slate-500 text-sm font-medium mb-1">
          <MapPin size={14} className="mr-1 text-gold" />
          Room {order.roomNumber}
        </div>
        {order.phoneNumber && (
          <div className="flex items-center text-slate-500 text-sm font-medium mb-1">
            <Phone size={14} className="mr-1 text-gold" />
            {order.phoneNumber}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${order.paymentMethod === 'card'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
            {order.paymentMethod === 'card' ? 'Card Payment' : 'Room Charge'}
          </span>
        </div>
      </div>

      <div className="pl-2 space-y-2 mb-4">
        {order.items.map((item, idx) => {
          // Handle potential legacy localized name object
          const itemName = typeof item.name === 'object' && item.name !== null
            ? (item.name as any)['en'] || 'Unknown Item'
            : item.name;

          return (
            <div key={idx} className="flex justify-between items-start text-sm text-slate-700">
              <span className="font-medium"><span className="text-ink font-bold mr-1">{item.quantity}x</span> {itemName}</span>
            </div>
          );
        })}
      </div>

      {order.notes && (
        <div className="ml-2 mb-4 p-3 bg-yellow-50 border border-yellow-100 rotate-1 shadow-sm">
          <p className="font-handwriting text-lg leading-5 text-slate-800">
            Note: {order.notes}
          </p>
        </div>
      )}

      <div className="pl-2 mt-auto">
        {nextStatus && (
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
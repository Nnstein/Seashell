import React from 'react';
import { Order } from '../src/types';
import { X, Clock, MapPin, CheckCircle, ChefHat, Truck, Phone, Star } from 'lucide-react';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (id: string, status: Order['status']) => void;
    onToggleVIP?: (orderId: string, currentVIPStatus: boolean) => void;
    userRole: string;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, onUpdateStatus, onToggleVIP, userRole }) => {
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

    const formatExactTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
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
    const orderTime = typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt
        ? (order.createdAt as any).seconds * 1000
        : typeof order.createdAt === 'number' ? order.createdAt : Date.now();

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center text-white
                    ${order.status === 'pending' ? 'bg-blue-600' : ''}
                    ${order.status === 'preparing' ? 'bg-amber-500' : ''}
                    ${order.status === 'ready' ? 'bg-emerald-600' : ''}
                    ${order.status === 'delivered' ? 'bg-purple-600' : ''}
                    ${order.status === 'completed' ? 'bg-slate-700' : ''}
                    ${order.status === 'cancelled' ? 'bg-red-600' : ''}
                `}>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold font-serif">Order #{order.id}</h2>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                                {order.status}
                            </span>
                            {userRole === 'admin' && onToggleVIP ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleVIP(order.id, order.isVIP || false);
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                                        order.isVIP 
                                            ? 'bg-amber-400 text-amber-900 hover:bg-amber-300' 
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                >
                                    <Star size={12} fill={order.isVIP ? "currentColor" : "none"} /> VIP
                                </button>
                            ) : (
                                order.isVIP && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Star size={12} fill="currentColor" /> VIP
                                    </span>
                                )
                            )}
                        </div>
                        <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
                            <Clock size={14} /> {formatExactTime(orderTime)} ({timeAgo(orderTime)})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
                    {/* Left Col: Order Items */}
                    <div className="flex-1 overflow-y-auto p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => {
                                const itemName = typeof item.name === 'object' && item.name !== null
                                    ? (item.name as any)['en'] || 'Unknown Item'
                                    : item.name;

                                const itemNotes = (item as any).notes || (item as any).specialInstructions || '';

                                return (
                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-ink">
                                                    <span className="text-amber-500 mr-2">{item.quantity}x</span> 
                                                    {itemName}
                                                </h4>
                                                {(item.hasBundlePricing || item.hasDiscount) && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
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
                                            <div className="text-right ml-4">
                                                <div className="font-bold text-lg text-ink">
                                                    {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)} KD
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {(item.unitPrice ?? item.price).toFixed(3)} KD each
                                                </div>
                                            </div>
                                        </div>

                                        {item.selectedSize && (
                                            <div className="mt-2 text-sm text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-400">
                                                <span className="font-semibold">📏 Size:</span> {item.selectedSize}
                                            </div>
                                        )}
                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="mt-2 text-sm text-teal-800 bg-teal-50 px-3 py-2 rounded-lg border-l-4 border-teal-400">
                                                <span className="font-semibold">➕ Add-ons:</span> {item.selectedAddons.join(', ')}
                                            </div>
                                        )}
                                        {itemNotes && (
                                            <div className="mt-2 text-sm text-amber-900 bg-amber-50 px-3 py-2 rounded-lg border-l-4 border-amber-400">
                                                <span className="font-semibold text-amber-600">📝 Note:</span> {itemNotes}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {(order as any).itemsEditNote && userRole === 'admin' && (
                            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                                <h4 className="text-red-800 font-bold flex items-center gap-2 mb-1 text-sm">
                                    <span className="text-lg">⚠️</span> Edit Note (Audit)
                                </h4>
                                <p className="text-red-700 text-sm">
                                    {(order as any).itemsEditNote}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Details & Actions */}
                    <div className="w-full md:w-80 flex flex-col bg-white overflow-y-auto">
                        <div className="p-6 flex-1 space-y-6">
                            
                            {/* Guest Details */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Guest Details</h3>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5">Name</p>
                                        <p className="font-bold text-ink text-lg">{order.guestName || 'Guest'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-amber-500" />
                                        <p className="font-medium text-slate-700">
                                            {order.chairNumber ? `Sunbed ${order.chairNumber}` : `Room ${order.roomNumber}`}
                                        </p>
                                    </div>
                                    {order.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-amber-500" />
                                            <p className="font-medium text-slate-700">{order.phoneNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Payment Method</span>
                                        <span className="font-bold uppercase text-slate-700">{order.paymentMethod || 'card'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Menu</span>
                                        <span className="font-bold uppercase text-slate-700">{order.menu || 'N/A'}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center">
                                        <span className="font-bold text-ink">Total Amount</span>
                                        <span className="text-2xl font-bold font-serif text-amber-500">{order.totalAmount.toFixed(3)} KD</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Late Payment Warning */}
                            {order.isLatePayment && order.status === 'pending' && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                                    <h4 className="text-red-800 font-bold flex items-center gap-2 mb-1">
                                        <span className="text-xl">⚠️</span> Late Payment
                                    </h4>
                                    <p className="text-red-600 text-sm">
                                        Money was captured hours after the order was placed. <strong>DO NOT COOK.</strong> Needs Refund.
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                            {nextStatus && (userRole === 'admin' || userRole === 'seashell' || userRole === 'presto' || userRole === 'room-service') && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(order.id, nextStatus);
                                        onClose();
                                    }}
                                    className={`w-full flex items-center justify-center py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors shadow-sm
                                            ${order.status === 'pending' ? 'bg-ink text-white hover:bg-blue-900' : ''}
                                            ${order.status === 'preparing' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
                                            ${order.status === 'ready' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}
                                            ${order.status === 'delivered' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                                        `}
                                >
                                    {order.status === 'pending' && <><ChefHat size={18} className="mr-2" /> Start Cooking</>}
                                    {order.status === 'preparing' && <><CheckCircle size={18} className="mr-2" /> Mark Ready</>}
                                    {order.status === 'ready' && <><Truck size={18} className="mr-2" /> Deliver Order</>}
                                    {order.status === 'delivered' && <><CheckCircle size={18} className="mr-2" /> Complete Order</>}
                                </button>
                            )}
                            
                            {/* Cancel Order Button */}
                            {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'delivered' && (userRole === 'admin' || userRole === 'seashell' || userRole === 'presto' || userRole === 'room-service') && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to cancel this order? This cannot be undone.')) {
                                            onUpdateStatus(order.id, 'cancelled');
                                            onClose();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                                >
                                    <X size={16} className="mr-2" /> Cancel Order
                                </button>
                            )}

                            {nextStatus && userRole === 'kitchen' && (
                                <div className="bg-white text-slate-400 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-2 italic">
                                    <Clock size={16} /> Kitchen View Only
                                </div>
                            )}
                            {!nextStatus && order.status === 'completed' && (
                                <div className="bg-slate-200 text-slate-500 py-4 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle size={16} /> Order Completed
                                </div>
                            )}
                            {order.status === 'cancelled' && (
                                <div className="bg-red-100 text-red-600 py-4 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <X size={16} /> Order Cancelled
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;

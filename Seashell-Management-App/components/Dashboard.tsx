import React, { useState } from 'react';
import { Order, OrderStatus } from '../src/types';
import OrderCard from './OrderCard';
import SearchBar from './SearchBar';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell, XAxis } from 'recharts';
import { LayoutGrid, List, ShoppingBag, Clock, Bell, BellOff } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';



interface DashboardProps {
    orders: Order[];
    onUpdateStatus: (id: string, status: Order['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onUpdateStatus }) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const { notificationsEnabled, toggleNotifications } = useOrders();

    // Calculate Stats
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

    // Mock data for chart
    const chartData = [
        { name: '10am', orders: 2 },
        { name: '11am', orders: 4 },
        { name: '12pm', orders: 8 },
        { name: '1pm', orders: 6 },
        { name: '2pm', orders: 3 },
        { name: '3pm', orders: 5 },
    ];

    const columns: { title: string, status: Order['status'], borderColor: string }[] = [
        { title: 'New Orders', status: 'pending', borderColor: 'border-blue-300' },
        { title: 'In Kitchen', status: 'preparing', borderColor: 'border-amber-300' },
        { title: 'Ready', status: 'ready', borderColor: 'border-emerald-300' },
        { title: 'Delivered', status: 'delivered', borderColor: 'border-purple-300' },
        { title: 'Completed', status: 'completed', borderColor: 'border-slate-300' },
    ];

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

    // Helper to get time safely
    const getTime = (order: Order) => {
        // Handle both Firestore Timestamp and regular number
        if (typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt) {
            return (order.createdAt as any).seconds * 1000;
        }
        return typeof order.createdAt === 'number' ? order.createdAt : Date.now();
    };

    // Filter orders based on search query
    const filteredOrders = orders.filter(order => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const roomNumber = order.roomNumber.toLowerCase();
        const guestName = (order.guestName || '').toLowerCase();
        const orderId = order.id.toLowerCase();

        // Check if any item name matches
        const itemsMatch = order.items.some(item => {
            const itemName = typeof item.name === 'object' ? item.name.en : item.name;
            return itemName.toLowerCase().includes(query);
        });

        return (
            roomNumber.includes(query) ||
            guestName.includes(query) ||
            orderId.includes(query) ||
            itemsMatch
        );
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => getTime(b) - getTime(a));

    return (
        <div className="h-full flex flex-col space-y-6 p-6 md:p-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink">Kitchen Overview</h2>
                    <p className="text-slate-500 font-serif italic mt-1">Manage workflow and guest requests</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Notification Toggle */}
                    <button
                        onClick={toggleNotifications}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${notificationsEnabled
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                        title={notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                    >
                        {notificationsEnabled ? <Bell size={16} className="mr-2" /> : <BellOff size={16} className="mr-2" />}
                        {notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                    </button>

                    {/* Enhanced Toggle Switch */}
                    <div className="bg-sand p-1 rounded-lg flex shadow-inner border border-slate-200/60">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${viewMode === 'kanban'
                                ? 'bg-white text-ink shadow-sm font-serif'
                                : 'text-slate-500 hover:text-ink'
                                }`}
                        >
                            <LayoutGrid size={16} className="mr-2" /> Board
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${viewMode === 'list'
                                ? 'bg-white text-ink shadow-sm font-serif'
                                : 'text-slate-500 hover:text-ink'
                                }`}
                        >
                            <List size={16} className="mr-2" /> List
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-xl">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by room, guest, order ID, or item..."
                />
            </div>

            {/* Stats Counters */}
            <div className="grid grid-cols-3 gap-2 md:gap-6">
                {/* Active Orders (New) */}
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-blue-500 relative overflow-hidden group rounded-lg">
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag className="w-8 h-8 md:w-16 md:h-16" />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1 truncate">Active</p>
                    <div className="flex flex-col md:flex-row md:items-baseline">
                        <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">{filteredOrders.filter(o => o.status === 'pending').length}</h3>
                        <span className="hidden md:inline ml-2 text-sm text-slate-400">New</span>
                    </div>
                </div>

                {/* Processing (In Kitchen + Ready + Delivered) */}
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-amber-500 relative overflow-hidden group rounded-lg">
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-8 h-8 md:w-16 md:h-16" />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1 truncate">Process</p>
                    <div className="flex flex-col md:flex-row md:items-baseline">
                        <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">
                            {filteredOrders.filter(o => ['preparing', 'ready', 'delivered'].includes(o.status)).length}
                        </h3>
                        <span className="hidden md:inline ml-2 text-sm text-slate-400">In Progress</span>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-slate-800 relative overflow-hidden group rounded-lg">
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutGrid className="w-8 h-8 md:w-16 md:h-16" />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1 truncate">Done</p>
                    <div className="flex flex-col md:flex-row md:items-baseline">
                        <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">{filteredOrders.filter(o => o.status === 'completed').length}</h3>
                        <span className="hidden md:inline ml-2 text-sm text-slate-400">Total</span>
                    </div>
                </div>
            </div>
            {/* Content View */}
            <div className="flex-1 min-h-0">
                {viewMode === 'kanban' ? (
                    <div className="h-full overflow-x-auto">
                        <div className="flex min-w-[1000px] h-full gap-6">
                            {columns.map(col => (
                                <div key={col.status} className="flex-1 min-w-[280px] flex flex-col h-full">
                                    <div className={`pb-3 border-b-2 ${col.borderColor} mb-4 flex justify-between items-end`}>
                                        <span className="font-serif font-bold text-lg text-ink">{col.title}</span>
                                        <span className="font-sans text-xs font-bold text-slate-400 bg-sand px-2 py-1 rounded-full">
                                            {orders.filter(o => o.status === col.status).length}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 scrollbar-hide notebook-paper rounded-lg p-2 overscroll-contain">
                                        {filteredOrders
                                            .filter(o => o.status === col.status)
                                            .sort((a, b) => getTime(b) - getTime(a))
                                            .map(order => (
                                                <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                                            ))
                                        }
                                        {filteredOrders.filter(o => o.status === col.status).length === 0 && (
                                            <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg m-2">
                                                <span className="text-slate-400 font-serif italic text-sm">No orders</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm overflow-hidden border-t-4 border-ink h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-y-auto overflow-x-auto flex-1 overscroll-contain">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-sand text-ink font-serif border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Order #</th>
                                        <th className="px-6 py-4 font-bold">Time</th>
                                        <th className="px-6 py-4 font-bold">Guest</th>
                                        <th className="px-6 py-4 font-bold">Items</th>
                                        <th className="px-6 py-4 font-bold">Total</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 text-right font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-paper">
                                    {sortedOrders.map((order) => {
                                        const nextStatus = getNextStatus(order.status);
                                        return (
                                            <tr key={order.id} className="hover:bg-white transition-colors group">
                                                <td className="px-6 py-4 font-bold text-ink">#{order.id.slice(0, 6)}</td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(getTime(order)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 font-medium text-ink">
                                                    <div>{order.guestName || 'Guest'}</div>
                                                    <div className="text-xs text-slate-400 mb-1">Rm {order.roomNumber}</div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${order.paymentMethod === 'card'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {order.paymentMethod === 'card' ? 'Card' : 'Room'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="mb-1">
                                                            <span className="font-bold text-ink">{item.quantity}x</span> {typeof item.name === 'object' ? (item.name as any).en : item.name}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 font-serif font-bold text-ink">${order.totalAmount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold tracking-wider uppercase border
                                            ${order.status === 'pending' ? 'bg-blue-50 text-blue-800 border-blue-100' : ''}
                                            ${order.status === 'preparing' ? 'bg-amber-50 text-amber-800 border-amber-100' : ''}
                                            ${order.status === 'ready' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : ''}
                                            ${order.status === 'delivered' ? 'bg-purple-50 text-purple-800 border-purple-100' : ''}
                                            ${order.status === 'completed' ? 'bg-slate-50 text-slate-800 border-slate-200' : ''}
                                            ${order.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' : ''}
                                        `}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {nextStatus && (
                                                        <button
                                                            onClick={() => onUpdateStatus(order.id, nextStatus)}
                                                            className="bg-ink text-white hover:bg-gold hover:text-ink font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors"
                                                        >
                                                            Mark {nextStatus}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
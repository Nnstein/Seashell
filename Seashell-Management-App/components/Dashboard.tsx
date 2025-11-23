import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import OrderCard from './OrderCard';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell, XAxis } from 'recharts';
import { LayoutGrid, List, ShoppingBag, Clock } from 'lucide-react';

interface DashboardProps {
    orders: Order[];
    onUpdateStatus: (id: string, status: Order['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onUpdateStatus }) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
        return order.createdAt?.seconds ? order.createdAt.seconds * 1000 : Date.now();
    };

    const sortedOrders = [...orders].sort((a, b) => getTime(b) - getTime(a));

    return (
        <div className="h-full flex flex-col space-y-6 p-6 md:p-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink">Kitchen Overview</h2>
                    <p className="text-slate-500 font-serif italic mt-1">Manage workflow and guest requests</p>
                </div>

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

            {/* Stats Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Orders (New) */}
                <div className="bg-white p-6 shadow-sm border-t-4 border-blue-500 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag size={64} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Active Orders</p>
                    <div className="flex items-baseline">
                        <h3 className="text-4xl font-serif font-bold text-ink">{orders.filter(o => o.status === 'pending').length}</h3>
                        <span className="ml-2 text-sm text-slate-400">New</span>
                    </div>
                </div>

                {/* Processing (In Kitchen + Ready + Delivered) */}
                <div className="bg-white p-6 shadow-sm border-t-4 border-amber-500 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Processing</p>
                    <div className="flex items-baseline">
                        <h3 className="text-4xl font-serif font-bold text-ink">
                            {orders.filter(o => ['preparing', 'ready', 'delivered'].includes(o.status)).length}
                        </h3>
                        <span className="ml-2 text-sm text-slate-400">In Progress</span>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white p-6 shadow-sm border-t-4 border-slate-800 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutGrid size={64} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Completed</p>
                    <div className="flex items-baseline">
                        <h3 className="text-4xl font-serif font-bold text-ink">{orders.filter(o => o.status === 'completed').length}</h3>
                        <span className="ml-2 text-sm text-slate-400">Total</span>
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

                                    <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 scrollbar-hide notebook-paper rounded-lg p-2">
                                        {orders
                                            .filter(o => o.status === col.status)
                                            .sort((a, b) => getTime(b) - getTime(a))
                                            .map(order => (
                                                <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                                            ))
                                        }
                                        {orders.filter(o => o.status === col.status).length === 0 && (
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
                        <div className="overflow-y-auto flex-1">
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
                                                    <div>Guest</div>
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
                                                        <div key={i} className="mb-1"><span className="font-bold text-ink">{item.quantity}x</span> {item.name.en}</div>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 font-serif font-bold text-ink">${order.total.toFixed(3)}</td>
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
import React, { useState, useEffect } from 'react';
import { Order } from '../src/types';
import { getOrderHistoryPaginated } from '../services/firestoreService';
import SearchBar from './SearchBar';
import { Calendar, DollarSign, Package, Filter, Loader, X } from 'lucide-react';

type FilterType = 'today' | 'week' | 'month' | 'this-year' | 'previous-year' | 'custom';

const OrderHistory: React.FC = () => {
    const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<FilterType>('today');
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(false);

    // Advanced filter states
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        loadInitialHistory();
    }, []);

    const loadInitialHistory = async () => {
        setLoading(true);
        try {
            const result = await getOrderHistoryPaginated(20);
            setHistoryOrders(result.orders);
            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading order history:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreOrders = async () => {
        if (!hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const result = await getOrderHistoryPaginated(20, lastDoc);
            setHistoryOrders(prev => [...prev, ...result.orders]);
            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading more orders:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const getTime = (order: Order) => {
        if (typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt) {
            return (order.createdAt as any).seconds * 1000;
        }
        return typeof order.createdAt === 'number' ? order.createdAt : Date.now();
    };

    const filterByDate = (order: Order) => {
        const orderTime = getTime(order);
        const now = Date.now();
        const orderDate = new Date(orderTime);

        switch (dateFilter) {
            case 'today': {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return orderTime >= today.getTime();
            }
            case 'week': {
                const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
                return orderTime >= weekAgo;
            }
            case 'month': {
                const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
                return orderTime >= monthAgo;
            }
            case 'this-year': {
                if (selectedMonth !== undefined) {
                    // Filter by specific month in current year
                    return orderDate.getFullYear() === selectedYear &&
                        orderDate.getMonth() === selectedMonth;
                }
                // Filter by entire current year
                return orderDate.getFullYear() === selectedYear;
            }
            case 'previous-year': {
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate).getTime();
                    const end = new Date(customEndDate).getTime();
                    return orderTime >= start && orderTime <= end;
                }
                // Filter by entire selected year
                return orderDate.getFullYear() === selectedYear;
            }
            case 'custom': {
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate).getTime();
                    const end = new Date(customEndDate).getTime();
                    return orderTime >= start && orderTime <= end;
                }
                return true;
            }
            default:
                return true;
        }
    };

    const filteredOrders = historyOrders.filter(order => {
        if (!filterByDate(order)) return false;
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const roomNumber = order.roomNumber.toLowerCase();
        const guestName = (order.guestName || '').toLowerCase();
        const orderId = order.id.toLowerCase();

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

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;

    const handleFilterChange = (newFilter: FilterType) => {
        setDateFilter(newFilter);
        setShowAdvancedFilter(newFilter === 'this-year' || newFilter === 'previous-year');

        // Reset advanced filter states
        if (newFilter === 'this-year') {
            setSelectedYear(new Date().getFullYear());
            setSelectedMonth(new Date().getMonth());
        } else if (newFilter === 'previous-year') {
            setSelectedYear(new Date().getFullYear() - 1);
            setCustomStartDate('');
            setCustomEndDate('');
        }
    };

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 10; i--) {
            years.push(i);
        }
        return years;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-400 font-serif">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink">Order History</h2>
                    <p className="text-slate-500 font-serif italic mt-1">Archived completed orders</p>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={dateFilter}
                            onChange={(e) => handleFilterChange(e.target.value as FilterType)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white focus:outline-none focus:border-gold"
                        >
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="this-year">This Year</option>
                            <option value="previous-year">Previous Years</option>
                        </select>
                    </div>

                    {/* Advanced Filter Panel */}
                    {showAdvancedFilter && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-serif font-bold text-ink text-sm">Advanced Filter</h3>
                                <button
                                    onClick={() => setShowAdvancedFilter(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {dateFilter === 'this-year' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-gold"
                                        >
                                            {generateYearOptions().map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Month (Optional)</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-gold"
                                        >
                                            <option value="">All Months</option>
                                            {monthNames.map((month, idx) => (
                                                <option key={idx} value={idx}>{month}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {dateFilter === 'previous-year' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-gold"
                                        >
                                            {generateYearOptions().filter(y => y < new Date().getFullYear()).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Date Range (Optional)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-gold"
                                                placeholder="Start"
                                            />
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-gold"
                                                placeholder="End"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-6 shadow-sm border-t-4 border-purple-500 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-purple-500" size={24} />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Orders</p>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-ink">{totalOrders}</h3>
                </div>

                <div className="bg-white p-4 md:p-6 shadow-sm border-t-4 border-green-500 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-green-500" size={24} />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Revenue</p>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-ink">{totalRevenue.toFixed(3)} KD</h3>
                </div>
            </div>

            {/* Orders Table */}
            <div className="flex-1 bg-white shadow-sm overflow-hidden border-t-4 border-ink flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-sand text-ink font-serif border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-bold">Order #</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Guest</th>
                                <th className="px-6 py-4 font-bold">Items</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-paper">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-serif italic">
                                        No orders found for the selected period
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white transition-colors">
                                        <td className="px-6 py-4 font-bold text-ink">#{order.id.slice(0, 6)}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(getTime(order)).toLocaleDateString()} {new Date(getTime(order)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-ink">
                                            <div>{order.guestName || 'Guest'}</div>
                                            <div className="text-xs text-slate-400">Rm {order.roomNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="mb-1">
                                                    <span className="font-bold text-ink">{item.quantity}x</span> {typeof item.name === 'object' ? (item.name as any).en : item.name}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 font-serif font-bold text-ink">{(order.totalAmount || 0).toFixed(3)} KD</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${order.paymentMethod === 'card'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {order.paymentMethod === 'card' ? 'Card' : 'Room'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {hasMore && !searchQuery && (
                    <div className="border-t border-slate-200 p-4 bg-sand flex justify-center">
                        <button
                            onClick={loadMoreOrders}
                            disabled={loadingMore}
                            className="flex items-center gap-2 px-6 py-3 bg-ink text-white hover:bg-gold hover:text-ink font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>Load More Orders</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;

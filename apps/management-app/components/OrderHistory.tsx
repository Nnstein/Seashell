import React, { useState, useEffect } from 'react';
import { Order, MenuSettings } from '../src/types';
import { CATEGORY_NAMES } from '../src/menuCategories';
import { getOrderHistoryPaginated, getMenuSettings } from '../services/firestoreService';
import { 
    Search, Tent, ChevronUp, ChevronDown, ChevronsUpDown, 
    FileText, FileSpreadsheet, Download, Filter, FileDigit, SlidersHorizontal, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderHistoryProps {
    userRole?: string;
    kitchenContext?: string;
}

type SortField = 'id' | 'date' | 'guest' | 'items' | 'category' | 'total' | 'payment';
type SortDir = 'asc' | 'desc';

const OrderHistory: React.FC<OrderHistoryProps> = ({ userRole, kitchenContext }) => {
    const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false); // Tablet/mobile filter toggle

    // Filters
    const [dateFilter, setDateFilter] = useState('Last 7 Days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [menuFilter, setMenuFilter] = useState<'all' | 'presto' | 'room-service' | 'seashell'>(
        (kitchenContext as 'presto' | 'room-service' | 'seashell') || 'all'
    );
    const [statusFilter, setStatusFilter] = useState({
        completed: true,
        pending: true,
        cancelled: true
    });
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'card' | 'hesabe' | 'room-charge'>('all');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [activeTab, setActiveTab] = useState<'all' | 'high-value' | 'refunded'>('all');

    // Sorting
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Reset pagination when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, customStartDate, customEndDate, menuFilter, statusFilter, paymentFilter, categoryFilter, activeTab, searchQuery, sortField, sortDir]);

    useEffect(() => {
        loadInitialHistory();
        loadActiveCategories();
    }, []);

    const loadActiveCategories = async () => {
        try {
            const settings = await getMenuSettings();
            if (settings && settings.categories) {
                const allCats = new Set<string>();
                if (settings.categories['room-service']) settings.categories['room-service'].forEach(c => allCats.add(c));
                if (settings.categories['presto']) settings.categories['presto'].forEach(c => allCats.add(c));
                if (settings.categories['seashell']) settings.categories['seashell'].forEach(c => allCats.add(c));
                setActiveCategories(Array.from(allCats));
            } else {
                setActiveCategories(Object.keys(CATEGORY_NAMES));
            }
        } catch (error) {
            console.error("Error loading active categories:", error);
            setActiveCategories(Object.keys(CATEGORY_NAMES));
        }
    };

    const loadInitialHistory = async () => {
        setLoading(true);
        try {
            const result = await getOrderHistoryPaginated(100);
            setHistoryOrders(result.orders);
        } catch (error) {
            console.error('Error loading order history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTime = (order: Order) => {
        if (typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt) {
            return (order.createdAt as any).seconds * 1000;
        }
        return typeof order.createdAt === 'number' ? order.createdAt : Date.now();
    };

    const clearFilters = () => {
        setDateFilter('All Time');
        setCustomStartDate('');
        setCustomEndDate('');
        setMenuFilter((kitchenContext as 'presto' | 'room-service' | 'seashell') || 'all');
        setStatusFilter({ completed: true, pending: true, cancelled: true });
        setPaymentFilter('all');
        setCategoryFilter('All Categories');
        setSearchQuery('');
        setActiveTab('all');
    };

    // Count active non-default filters for badge
    const activeFilterCount = [
        dateFilter !== 'All Time' && dateFilter !== 'Last 7 Days',
        menuFilter !== 'all',
        !statusFilter.completed || !statusFilter.pending || !statusFilter.cancelled,
        paymentFilter !== 'all',
        categoryFilter !== 'All Categories',
    ].filter(Boolean).length;

    const filteredOrders = historyOrders.filter(order => {
        const orderTime = getTime(order);
        const now = Date.now();
        
        // Date
        if (dateFilter === 'Today') {
             const today = new Date(); today.setHours(0,0,0,0);
             if (orderTime < today.getTime()) return false;
        } else if (dateFilter === 'Last 7 Days') {
             if (orderTime < now - 7*24*60*60*1000) return false;
        } else if (dateFilter === 'Last 30 Days') {
             if (orderTime < now - 30*24*60*60*1000) return false;
        } else if (dateFilter === 'This Year') {
             const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
             if (orderTime < startOfYear) return false;
        } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
             const start = new Date(customStartDate).getTime();
             const end = new Date(customEndDate).setHours(23, 59, 59, 999);
             if (orderTime < start || orderTime > end) return false;
        }

        // Menu (Role-based)
        if (userRole === 'admin' || userRole === 'admin2' || userRole === 'kitchen') {
            if (menuFilter !== 'all') {
                if (menuFilter === 'room-service') {
                    if (order.menu !== 'room-service' && !!order.menu) return false;
                } else {
                    if (order.menu !== menuFilter) return false;
                }
            }
        } else {
            if (userRole === 'seashell' && order.menu !== 'seashell') return false;
            if (userRole === 'presto' && order.menu !== 'presto') return false;
            if (userRole === 'room-service' && order.menu !== 'room-service' && !!order.menu) return false;
        }

        // Status
        const isCompleted = order.status === 'completed' || order.status === 'delivered';
        const isPending = order.status === 'pending' || order.status === 'preparing' || order.status === 'ready';
        const isCancelled = order.status === 'cancelled';
        
        if (!statusFilter.completed && isCompleted) return false;
        if (!statusFilter.pending && isPending) return false;
        if (!statusFilter.cancelled && isCancelled) return false;

        // Payment
        if (paymentFilter !== 'all') {
            if (paymentFilter === 'card' && order.paymentMethod !== 'card') return false;
            if (paymentFilter === 'hesabe' && order.paymentMethod !== 'hesabe') return false;
            if (paymentFilter === 'room-charge' && order.paymentMethod) return false;
        }

        // Tabs
        if (activeTab === 'high-value' && (order.totalAmount || 0) < 5) return false;
        if (activeTab === 'refunded' && !isCancelled) return false;

        // Category
        if (categoryFilter !== 'All Categories') {
            const hasCat = order.items.some(item => (item as any).category === categoryFilter);
            if (!hasCat) return false;
        }

        // Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const roomNumber = (order.roomNumber || '').toLowerCase();
            const guestName = (order.guestName || '').toLowerCase();
            const orderId = (order.id || '').toLowerCase();
            const itemsMatch = order.items.some(item => {
                const itemName = typeof item.name === 'object' ? item.name.en : item.name;
                return itemName.toLowerCase().includes(query);
            });
            if (!roomNumber.includes(query) && !guestName.includes(query) && !orderId.includes(query) && !itemsMatch) return false;
        }

        return true;
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir(field === 'date' ? 'desc' : 'asc');
        }
    };

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortField) {
            case 'id': return dir * a.id.localeCompare(b.id);
            case 'date': return dir * (getTime(a) - getTime(b));
            case 'guest': return dir * (a.roomNumber || '').localeCompare(b.roomNumber || '');
            case 'total': return dir * ((a.totalAmount || 0) - (b.totalAmount || 0));
            case 'payment': return dir * (a.status || '').localeCompare(b.status || '');
            default: return 0;
        }
    });

    const totalPages = Math.max(1, Math.ceil(sortedOrders.length / ITEMS_PER_PAGE));
    const paginatedOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Combine live menu settings categories with legacy categories from orders
    const combinedCategoriesList = Array.from(new Set([
        ...activeCategories,
        ...historyOrders.flatMap(o => o.items.map(i => (i as any).category)).filter(Boolean)
    ])).sort();
    const categoriesList = ['All Categories', ...combinedCategoriesList];

    const SortableHeader: React.FC<{ field: SortField; label: string; hideOnMd?: boolean }> = ({ field, label, hideOnMd }) => {
        const active = sortField === field;
        return (
            <th
                className={`px-4 lg:px-6 py-4 font-bold cursor-pointer select-none hover:bg-stone-100 transition-colors group text-ink whitespace-nowrap ${hideOnMd ? 'hidden lg:table-cell' : ''}`}
                onClick={() => handleSort(field)}
            >
                <div className="flex items-center gap-1.5">
                    {label}
                    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        {!active && <ChevronsUpDown size={13} />}
                        {active && sortDir === 'asc' && <ChevronUp size={13} className="text-amber-600" />}
                        {active && sortDir === 'desc' && <ChevronDown size={13} className="text-amber-600" />}
                    </span>
                </div>
            </th>
        );
    };

    const selectClass = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-slate-50 focus:bg-white text-ink transition-all";
    const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-widest";

    // ── Export Logic ──
    const formatExportData = () => {
        return sortedOrders.map(order => {
            const d = new Date(getTime(order));
            const firstCategory = order.items.length > 0 ? ((order.items[0] as any).category || 'Mixed') : 'Unknown';
            const itemsText = order.items.map(i => `${i.quantity}x ${typeof i.name === 'object' ? i.name.en : i.name}`).join('; ');
            
            return {
                'Order ID': order.id,
                'Date': `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`,
                'Guest/Room': order.roomNumber || order.guestName || 'Walk-in',
                'Menu': order.menu || 'unknown',
                'Category': firstCategory,
                'Items': itemsText,
                'Total (KD)': (order.totalAmount || 0).toFixed(3),
                'Payment Method': order.paymentMethod || 'unknown',
                'Status': order.status
            };
        });
    };

    const handleExportCSV = () => {
        const data = formatExportData();
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${String((row as any)[h] || '').replace(/"/g, '""')}"`).join(','))
        ];
        const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seashell-orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportXLSX = () => {
        const data = formatExportData();
        if (data.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
        XLSX.writeFile(workbook, `seashell-orders-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const data = formatExportData();
        if (data.length === 0) return;
        const doc = new jsPDF();
        doc.text('Seashell Order History', 14, 15);
        const tableColumn = ["ID", "Date", "Guest", "Items", "Total (KD)", "Status"];
        const tableRows = data.map(row => [
            row['Order ID'].slice(0, 8),
            row['Date'].split(',')[0],
            row['Guest/Room'].slice(0, 15),
            row['Items'].slice(0, 40) + (row['Items'].length > 40 ? '...' : ''),
            row['Total (KD)'],
            row['Status']
        ]);
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [24, 24, 27] } // ink color
        });
        doc.save(`seashell-orders-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-400 font-serif animate-pulse">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-y-auto">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 md:px-6 lg:px-8 pt-6 pb-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-serif font-bold text-ink">Order History</h2>
                    <p className="text-slate-500 font-serif italic text-sm mt-0.5">Archived completed orders</p>
                </div>

                {/* Search + Filter toggle row */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search guest, room, order ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                        />
                    </div>
                    {/* Tablet/mobile filter toggle */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`relative flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded-lg transition-colors xl:hidden ${showFilters ? 'bg-ink text-white border-ink' : 'border-slate-200 text-slate-600 hover:border-gold hover:text-gold'}`}
                    >
                        {showFilters ? <X size={15} /> : <SlidersHorizontal size={15} />}
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold text-white text-[9px] font-black flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ─ always visible on xl, toggled on tablet/mobile ── */}
            <div className={`flex-shrink-0 px-4 md:px-6 lg:px-8 pb-4 ${showFilters ? 'block' : 'hidden xl:block'}`}>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 lg:p-5">
                    {/* Row 1: Date + Outlet + Payment + Category + Clear */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 xl:gap-4">
                        {/* Date Range */}
                        <div className={`flex flex-col gap-1.5 ${dateFilter === 'Custom' ? 'col-span-2 md:col-span-3 xl:col-span-2' : ''}`}>
                            <span className={labelClass}>Date Range</span>
                            <div className="flex gap-2 items-center">
                                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={`${selectClass} ${dateFilter === 'Custom' ? 'w-auto xl:w-1/3' : 'w-full'}`}>
                                    <option>Today</option>
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>This Year</option>
                                    <option>All Time</option>
                                    <option value="Custom">Custom</option>
                                </select>
                                {dateFilter === 'Custom' && (
                                    <div className="flex gap-2 flex-1">
                                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={selectClass} />
                                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={selectClass} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Menu Source — Admin/Kitchen (without specific context) only, takes a slot */}
                        {(userRole === 'admin' || userRole === 'admin2' || (userRole === 'kitchen' && !kitchenContext)) ? (
                            <div className="flex flex-col gap-1.5">
                                <span className={labelClass}>Menu Source</span>
                                <select value={menuFilter} onChange={e => setMenuFilter(e.target.value as any)} className={selectClass}>
                                    <option value="all">All Outlets</option>
                                    <option value="seashell">Seashell</option>
                                    <option value="presto">Presto</option>
                                    <option value="room-service">Room Service</option>
                                </select>
                            </div>
                        ) : (
                            /* Ghost spacer so grid stays aligned for outlet staff */
                            <div className="hidden xl:block" />
                        )}

                        {/* Payment Type */}
                        <div className="flex flex-col gap-1.5">
                            <span className={labelClass}>Payment Type</span>
                            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as any)} className={selectClass}>
                                <option value="all">All Types</option>
                                <option value="card">Card / KNET</option>
                                <option value="hesabe">Hesabe Gateway</option>
                                <option value="room-charge">Room Charge / Cash</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-1.5">
                            <span className={labelClass}>Category</span>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectClass}>
                                {categoriesList.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Clear */}
                        <div className="flex flex-col gap-1.5 justify-end">
                            <span className={`${labelClass} invisible`}>.</span>
                            <button onClick={clearFilters} className="h-[38px] px-4 text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:text-ink transition-all">
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Order Status checkboxes — always a dedicated row */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className={`${labelClass} block mb-2`}>Order Status</span>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {(['completed', 'pending', 'cancelled'] as const).map(key => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={statusFilter[key]}
                                        onChange={e => setStatusFilter({ ...statusFilter, [key]: e.target.checked })}
                                        className="rounded-sm border-slate-300 text-gold focus:ring-gold w-4 h-4"
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-ink transition-colors capitalize">{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table Container ── */}
            <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 lg:px-8 pb-6">
                {/* Sub-header: tabs + export */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    {/* View Tabs */}
                    <div className="flex p-1 bg-slate-100/80 rounded-lg border border-slate-200/50">
                        {([
                            { key: 'all', icon: <Filter size={13} />, label: 'All Orders' },
                            { key: 'high-value', icon: <FileText size={13} />, label: 'High-Value' },
                            { key: 'refunded', icon: <FileDigit size={13} />, label: 'Refunded' },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-300 ${activeTab === tab.key ? 'bg-ink text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Export buttons — hidden on small, visible md+ */}
                    <div className="hidden sm:flex gap-2">
                        <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 rounded-lg hover:border-gold hover:text-gold transition-colors">
                            <FileText size={13} /> CSV <Download size={11} />
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 rounded-lg hover:border-gold hover:text-gold transition-colors">
                            <FileText size={13} /> PDF <Download size={11} />
                        </button>
                        <button onClick={handleExportXLSX} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 rounded-lg hover:border-gold hover:text-gold transition-colors">
                            <FileSpreadsheet size={13} /> XLSX <Download size={11} />
                        </button>
                    </div>
                </div>

                {/* Table card */}
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-ink">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left min-w-[640px]">
                            <thead className="bg-sand text-ink font-serif border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="w-3 lg:w-4"></th>
                                    <SortableHeader field="id" label="Order ID" />
                                    <SortableHeader field="date" label="Date" />
                                    <SortableHeader field="guest" label="Guest / Room" />
                                    <th className="px-4 lg:px-6 py-4 font-bold whitespace-nowrap">Items</th>
                                    {/* Category column hidden on md, shown on lg+ */}
                                    <SortableHeader field="category" label="Category" hideOnMd />
                                    <SortableHeader field="total" label="Total" />
                                    <SortableHeader field="payment" label="Status" />
                                    <th className="w-3 lg:w-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-16 text-center text-slate-400 font-serif text-sm">
                                            No orders match your current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order) => {
                                        const d = new Date(getTime(order));
                                        const dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                                        const firstCategory = order.items.length > 0 ? ((order.items[0] as any).category || 'Mixed') : 'Unknown';
                                        const isCompleted = order.status === 'completed' || order.status === 'delivered';
                                        const isCancelled = order.status === 'cancelled';

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td></td>
                                                <td className="py-3.5 px-4 lg:px-6 text-sm font-bold text-ink whitespace-nowrap">
                                                    #{order.id.slice(0, 5)}
                                                </td>
                                                <td className="py-3.5 px-4 lg:px-6 text-xs lg:text-sm text-slate-500 whitespace-nowrap">
                                                    {dateStr}
                                                </td>
                                                <td className="py-3.5 px-4 lg:px-6">
                                                    <div className="flex items-center gap-2 lg:gap-3">
                                                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-sand flex items-center justify-center text-gold border border-gold/20 flex-shrink-0">
                                                            <Tent size={13} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-ink truncate">Rm {order.roomNumber || order.chairNumber || 'Walk-in'}</span>
                                                            <span className="text-xs text-slate-500 italic font-serif truncate">{order.guestName || 'Guest'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 lg:px-6 text-sm text-slate-600 max-w-[160px] lg:max-w-[200px] truncate">
                                                    <span className="font-bold text-ink">{order.items.length > 0 ? order.items[0].quantity : 0}x</span>{' '}
                                                    {order.items.length > 0 ? (typeof order.items[0].name === 'object' ? order.items[0].name.en : order.items[0].name) : 'Items'}
                                                    {order.items.length > 1 && <span className="text-slate-400 text-xs ml-1 italic">+{order.items.length - 1}</span>}
                                                </td>
                                                {/* Category — hidden on md, visible lg+ */}
                                                <td className="py-3.5 px-4 lg:px-6 text-sm text-slate-500 whitespace-nowrap hidden lg:table-cell">
                                                    {firstCategory}
                                                </td>
                                                <td className="py-3.5 px-4 lg:px-6 text-sm font-bold text-ink whitespace-nowrap">
                                                    {(order.totalAmount || 0).toFixed(3)} KD
                                                </td>
                                                <td className="py-3.5 px-4 lg:px-6 whitespace-nowrap">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        isCancelled ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td></td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex-shrink-0 border-t border-slate-200 px-4 lg:px-6 py-3 flex justify-between items-center bg-sand">
                        <span className="text-xs text-slate-500 font-serif italic">
                            Showing {paginatedOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedOrders.length)} of {sortedOrders.length} entries
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="hover:text-gold transition-colors px-1 disabled:opacity-50"
                            >
                                {'<'} Prev
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                let pageNum = currentPage;
                                if (totalPages <= 5) {
                                    pageNum = idx + 1;
                                } else {
                                    if (currentPage <= 3) pageNum = idx + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                                    else pageNum = currentPage - 2 + idx;
                                }
                                return (
                                    <button 
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                            currentPage === pageNum 
                                            ? 'bg-ink text-white' 
                                            : 'hover:bg-slate-200 text-ink'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="hover:text-gold transition-colors px-1 disabled:opacity-50"
                            >
                                Next {'>'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;

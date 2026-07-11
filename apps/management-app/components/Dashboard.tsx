import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, MenuSettings } from '../src/types';
import OrderCard from './OrderCard';
import SearchBar from './SearchBar';
import CloseMenuModal from './CloseMenuModal';
import EditCompletedOrderModal from './EditCompletedOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import { LayoutGrid, List, ShoppingBag, Clock, Bell, BellOff, Volume2, DoorOpen, DoorClosed, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { unlockAudio, isAudioUnlocked, requestNotificationPermission } from '../utils/notifications';
import { getPendingOrdersCount, setMenuStatus, getMenuSettings, toggleOrderVIP } from '../services/firestoreService';
import { useToast } from './Toast';

interface DashboardProps {
    orders: Order[];
    onUpdateStatus: (id: string, status: Order['status']) => void;
    userRole: 'admin' | 'admin2' | 'kitchen' | 'seashell' | 'presto' | 'room-service';
    kitchenContext?: 'room-service' | 'seashell' | 'presto';
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onUpdateStatus, userRole, kitchenContext }) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    // menuFilter is the secondary outlet filter for kitchen & admin.
    // Outlet staff (seashell/presto/room-service) are already hard-locked by roleFilteredOrders.
    const [menuFilter, setMenuFilter] = useState<'all' | 'presto' | 'room-service' | 'seashell'>(kitchenContext || 'all');
    const { notificationsEnabled, toggleNotifications } = useOrders();
    const [pendingCount, setPendingCount] = useState(0);
    const [menuSettings, setMenuSettings] = useState<MenuSettings | null>(null);
    const [isToggling, setIsToggling] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [togglingMenu, setTogglingMenu] = useState<'presto' | 'room-service' | 'seashell' | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const { showError } = useToast();

    const fetchMenuStatus = async () => {
        const count = await getPendingOrdersCount();
        setPendingCount(count);
        const settings = await getMenuSettings();
        setMenuSettings(settings);
    };

    useEffect(() => {
        setAudioReady(isAudioUnlocked());
        fetchMenuStatus();
    }, []);

    useEffect(() => {
        fetchMenuStatus();
    }, [orders]);

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            const unlocked = await unlockAudio();
            setAudioReady(unlocked);
            await requestNotificationPermission();
        }
        toggleNotifications();
    };

    const isMenuOpen = (menu: 'presto' | 'room-service' | 'seashell') => {
        return menuSettings?.menuStatus?.[menu]?.isOpen ?? menuSettings?.menuOpen ?? true;
    };

    const handleMenuToggle = (menu: 'presto' | 'room-service' | 'seashell') => {
        setTogglingMenu(menu);
        if (isMenuOpen(menu)) {
            setShowCloseModal(true);
        } else {
            handleReopenMenu(menu);
        }
    };

    const handleReopenMenu = async (menu: 'presto' | 'room-service' | 'seashell') => {
        setIsToggling(true);
        try {
            await setMenuStatus(menu, true);
            await fetchMenuStatus();
        } catch (error) {
            console.error('Error reopening menu:', error);
        } finally {
            setIsToggling(false);
            setTogglingMenu(null);
        }
    };

    const handleCloseMenuWithMessage = async (message: string) => {
        if (!togglingMenu) return;
        setIsToggling(true);
        try {
            await setMenuStatus(togglingMenu, false, message);
            await fetchMenuStatus();
            setShowCloseModal(false);
        } catch (error) {
            console.error('Error closing menu:', error);
        } finally {
            setIsToggling(false);
            setTogglingMenu(null);
        }
    };

    const handleUpdateStatus = (id: string, status: OrderStatus) => {
        const targetOrder = orders.find(o => o.id === id);
        if (targetOrder && userRole === 'kitchen' && kitchenContext && targetOrder.menu !== kitchenContext) {
            const sectionNames: Record<string, string> = {
                'room-service': 'Room Service',
                'seashell': 'Seashell',
                'presto': 'Presto'
            };
            const actualSection = sectionNames[targetOrder.menu] || targetOrder.menu;
            showError(`This order belongs to the ${actualSection} Kitchen. Please switch sections to process it.`);
            return;
        }
        onUpdateStatus(id, status);
    };

    const handleToggleVIP = async (orderId: string, currentVIPStatus: boolean) => {
        try {
            await toggleOrderVIP(orderId, !currentVIPStatus);
        } catch (error) {
            console.error('Error toggling VIP status:', error);
        }
    };

    // --- Role-based Filtering Logic ---
    // Step 1: Hard partition by role — each outlet staff only ever sees their own orders.
    // Admin/admin2 see everything. Kitchen sees everything (unless locked to a specific kitchen context).
    const roleFilteredOrders = orders.filter(order => {
        if (userRole === 'admin' || userRole === 'admin2') return true;
        if (userRole === 'kitchen') {
            if (kitchenContext) {
                if (kitchenContext === 'room-service') return order.menu === 'room-service' || !order.menu;
                return order.menu === kitchenContext;
            }
            return true;
        }
        if (userRole === 'seashell') return order.menu === 'seashell';
        if (userRole === 'presto') return order.menu === 'presto';
        if (userRole === 'room-service') return order.menu === 'room-service' || !order.menu;
        return false;
    });

    // Step 2: Optional secondary outlet filter (for admin and kitchen who see multiple menus)
    const outletFilteredOrders = roleFilteredOrders.filter(order => {
        if (menuFilter === 'all') return true;
        if (menuFilter === 'room-service') return order.menu === 'room-service' || !order.menu;
        return order.menu === menuFilter;
    }).filter(order => {
        // Hide unpaid and cancelled orders from operational staff to prevent accidental preparation
        if (userRole !== 'admin' && userRole !== 'admin2') {
            return (order.status as string) !== 'awaiting_payment' && order.status !== 'cancelled';
        }
        return true;
    });

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
            default: return null;
        }
    };

    const getTime = (order: Order) => {
        if (typeof order.createdAt === 'object' && order.createdAt && 'seconds' in order.createdAt) {
            return (order.createdAt as any).seconds * 1000;
        }
        return typeof order.createdAt === 'number' ? order.createdAt : Date.now();
    };

    const filteredOrders = outletFilteredOrders.filter(order => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const itemsMatch = order.items.some(item => {
            const itemName = typeof item.name === 'object' ? item.name.en : item.name;
            return itemName.toLowerCase().includes(query);
        });
        return order.roomNumber.toLowerCase().includes(query) || (order.guestName || '').toLowerCase().includes(query) || order.id.toLowerCase().includes(query) || itemsMatch;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => getTime(b) - getTime(a));

    // Outlet filter tabs — shown for admin and kitchen (unless kitchen selected a specific context)
    const showOutletFilter = userRole === 'admin' || userRole === 'admin2' || (userRole === 'kitchen' && !kitchenContext);
    const outletTabs: { label: string; value: 'all' | 'presto' | 'room-service' | 'seashell' }[] = [
        { label: 'All', value: 'all' },
        { label: 'Presto', value: 'presto' },
        { label: 'RoomSVC', value: 'room-service' },
        { label: 'Seashell', value: 'seashell' },
    ];

    const menuLabel = (m: string) => m === 'room-service' ? 'Room Service' : m.charAt(0).toUpperCase() + m.slice(1);

    return (
        <div className="h-full flex flex-col space-y-4 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-ink">
                            {(userRole === 'admin' || userRole === 'admin2') ? 'Management' : 
                             userRole === 'seashell' ? 'Seashell' : 
                             userRole === 'presto' ? 'Presto' :
                             userRole === 'room-service' ? 'Room Service' : 'Kitchen'} Overview
                        </h2>
                        <button 
                            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                            className="text-slate-400 hover:text-ink p-1.5 rounded-full hover:bg-slate-200 transition-colors shadow-sm bg-white border border-slate-200"
                            title={isHeaderCollapsed ? "Expand Dashboard Header" : "Collapse Dashboard Header"}
                        >
                            {isHeaderCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                    </div>
                    {!isHeaderCollapsed && <p className="text-slate-500 font-serif italic mt-1">Manage workflow and guest requests</p>}
                </div>

                {!isHeaderCollapsed && (
                <div className="flex items-center gap-3">
                    {(() => {
                        let menusToToggle: ('presto' | 'room-service' | 'seashell')[] = [];
                        if (userRole === 'admin' || userRole === 'admin2') {
                            menusToToggle = ['presto', 'room-service', 'seashell'];
                        } else if (userRole === 'presto' || userRole === 'room-service' || userRole === 'seashell') {
                            menusToToggle = [userRole];
                        }
                        
                        if (menusToToggle.length === 0) return null;
                        
                        return (
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                {menusToToggle.map(menu => (
                                    <button
                                        key={menu}
                                        onClick={() => handleMenuToggle(menu)}
                                        disabled={isToggling}
                                        className={`flex items-center px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 border shadow-sm ${
                                            isMenuOpen(menu) ? 'bg-white text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isMenuOpen(menu) ? <DoorOpen size={12} className="mr-1.5" /> : <DoorClosed size={12} className="mr-1.5" />}
                                        {menu === 'room-service' ? 'RoomSVC' : menu.charAt(0).toUpperCase() + menu.slice(1)}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}

                    <button
                        onClick={handleNotificationToggle}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all border ${notificationsEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    >
                        {notificationsEnabled ? <Bell size={16} className="mr-2" /> : <BellOff size={16} className="mr-2" />}
                        {notificationsEnabled ? 'Sound ON' : 'Enable Sound'}
                    </button>

                    <div className="bg-sand p-1 rounded-lg flex shadow-inner border border-slate-200/60">
                        <button onClick={() => setViewMode('kanban')} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white text-ink shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={16} className="mr-2" /> Board</button>
                        <button onClick={() => setViewMode('list')} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-ink shadow-sm' : 'text-slate-500'}`}><List size={16} className="mr-2" /> List</button>
                    </div>
                </div>
                )}
            </div>

            {!isHeaderCollapsed && (
            <>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 max-w-xl">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by room, guest, order ID, or item..." />
                </div>
                {/* Outlet filter — visible only to admin and kitchen */}
                {showOutletFilter && (
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 flex-shrink-0">
                        {outletTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setMenuFilter(tab.value)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                                    menuFilter === tab.value
                                        ? 'bg-ink text-white border-ink shadow-sm'
                                        : 'bg-white text-slate-500 border-transparent hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                                <span className="ml-1.5 bg-white/20 text-inherit px-1 py-0.5 rounded text-[9px]">
                                    {roleFilteredOrders.filter(o =>
                                        tab.value === 'all' ? true :
                                        tab.value === 'room-service' ? (o.menu === 'room-service' || !o.menu) :
                                        o.menu === tab.value
                                    ).length}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-6">
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-blue-500 rounded-lg">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Active</p>
                    <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">{filteredOrders.filter(o => o.status === 'pending').length}</h3>
                </div>
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-amber-500 rounded-lg">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Process</p>
                    <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">{filteredOrders.filter(o => ['preparing', 'ready', 'delivered'].includes(o.status)).length}</h3>
                </div>
                <div className="bg-white p-3 md:p-6 shadow-sm border-t-2 md:border-t-4 border-slate-800 rounded-lg">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Done</p>
                    <h3 className="text-2xl md:text-4xl font-serif font-bold text-ink">{filteredOrders.filter(o => o.status === 'completed').length}</h3>
                </div>
            </div>
            </>
            )}

            <div className="flex-1 min-h-0">
                {viewMode === 'kanban' ? (
                    <div className="h-full overflow-x-auto">
                        <div className="flex min-w-[1000px] h-full gap-6">
                            {columns.map(col => (
                                <div key={col.status} className="flex-1 min-w-[280px] flex flex-col h-full">
                                    <div className={`pb-3 border-b-2 ${col.borderColor} mb-4 flex justify-between items-end`}>
                                        <span className="font-serif font-bold text-lg text-ink">{col.title}</span>
                                        <span className="font-sans text-xs font-bold text-slate-400 bg-sand px-2 py-1 rounded-full">{filteredOrders.filter(o => o.status === col.status).length}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 scrollbar-hide notebook-paper rounded-lg p-2">
                                        {filteredOrders.filter(o => o.status === col.status).sort((a, b) => getTime(b) - getTime(a)).map(order => (
                                            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onToggleVIP={handleToggleVIP} onEditItems={(userRole === 'admin' || userRole === 'admin2') ? setEditingOrder : undefined} onViewDetails={setViewingOrder} userRole={userRole === 'admin2' ? 'admin' : userRole} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm overflow-hidden border-t-4 border-ink h-full flex flex-col">
                        <div className="overflow-y-auto overflow-x-auto flex-1">
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
                                            <tr key={order.id} className="hover:bg-white transition-colors">
                                                <td className="px-6 py-4 font-bold text-ink">#{order.id.slice(0, 6)}</td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(getTime(order)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 font-medium text-ink">
                                                    <div className="flex items-center gap-2">
                                                        <span>{order.guestName || 'Guest'}</span>
                                                        {(userRole === 'admin' || userRole === 'admin2') && (
                                                            <button onClick={() => handleToggleVIP(order.id, order.isVIP || false)} className={`p-0.5 rounded ${order.isVIP ? 'text-amber-500' : 'text-slate-300'}`}>
                                                                <Star size={14} fill={order.isVIP ? 'currentColor' : 'none'} />
                                                            </button>
                                                        )}
                                                        {(userRole !== 'admin' && userRole !== 'admin2') && order.isVIP && (
                                                            <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"><Star size={10} fill="white" />VIP</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mb-1">{order.chairNumber ? `Sunbed ${order.chairNumber}` : `Rm ${order.roomNumber}`}</div>
                                                    {order.menu && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${order.menu === 'room-service' ? 'bg-indigo-50 text-indigo-700' : order.menu === 'seashell' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                                            {order.menu === 'room-service' ? 'RoomSVC' : order.menu === 'seashell' ? 'Seashell' : 'Presto'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="mb-1"><span className="font-bold text-ink">{item.quantity}x</span> {typeof item.name === 'object' ? (item.name as any).en : item.name}</div>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 font-serif font-bold text-ink">{order.totalAmount.toFixed(3)} KD</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold tracking-wider uppercase border ${order.status === 'pending' ? 'bg-blue-50 text-blue-800' : ''} ${order.status === 'preparing' ? 'bg-amber-50 text-amber-800' : ''} ${order.status === 'ready' ? 'bg-emerald-50 text-emerald-800' : ''} ${order.status === 'delivered' ? 'bg-purple-50 text-purple-800' : ''}`}>{order.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {nextStatus && (userRole === 'admin' || userRole === 'admin2' || userRole === 'seashell' || userRole === 'presto' || userRole === 'room-service') && (
                                                        <button onClick={() => handleUpdateStatus(order.id, nextStatus)} className="bg-ink text-white hover:bg-gold hover:text-ink font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors">Mark {nextStatus}</button>
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
            <CloseMenuModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleCloseMenuWithMessage} isSubmitting={isToggling} />
            {editingOrder && (
                <EditCompletedOrderModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={() => setEditingOrder(null)}
                />
            )}
            {viewingOrder && (
                <OrderDetailsModal
                    order={viewingOrder}
                    onClose={() => setViewingOrder(null)}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleVIP={handleToggleVIP}
                    userRole={userRole === 'admin2' ? 'admin' : userRole}
                />
            )}
        </div>
    );
};

export default Dashboard;

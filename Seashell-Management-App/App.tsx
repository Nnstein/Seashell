import React, { useState, useEffect } from 'react';
import { User, Order, MenuItem, OrderStatus } from './src/types';
import { getMenuItems, archiveCompletedOrders } from './services/firestoreService';
import { useOrders } from './context/OrdersContext';
import Dashboard from './components/Dashboard';
import MenuEditor from './components/MenuEditor';
import OrderHistory from './components/OrderHistory';
import Login from './components/Login';
import { LayoutDashboard, UtensilsCrossed, LogOut, Shell, Menu, X, History } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'history'>('dashboard');
  const { orders, loading, updateOrderStatus } = useOrders();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load data from Firestore and archive old orders
  useEffect(() => {
    loadMenu();
    if (user) {
      archiveOldOrders();
    }
  }, [user]);

  const loadMenu = async () => {
    const menuItems = await getMenuItems();
    setMenu(menuItems);
  };

  const handleLogin = (username: string) => {
    setUser({ username, role: 'admin' });
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
  };

  const handleMenuUpdate = () => {
    loadMenu();
  };

  const archiveOldOrders = async () => {
    try {
      const count = await archiveCompletedOrders();
      if (count > 0) {
        console.log(`✅ Successfully archived ${count} completed orders from yesterday to history.`);
      } else {
        console.log('ℹ️ No old completed orders to archive today.');
      }
    } catch (error) {
      console.error('Error archiving orders:', error);
    }
  };

  const handleNavClick = (tab: 'dashboard' | 'menu' | 'history') => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-paper text-gold"><Shell className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="flex h-screen w-full bg-paper overflow-hidden font-sans overscroll-none touch-pan-y">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-ink text-white flex flex-col shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col items-center border-b border-slate-800 relative">
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>

          <div className="text-gold mb-3">
            <Shell size={32} />
          </div>
          <div className="text-center">
            <h1 className="font-serif font-bold text-lg tracking-wide text-gold">F & B MEALS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Manager Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-4">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                ${activeTab === 'dashboard' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard size={20} className={`mr-3 ${activeTab === 'dashboard' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm font-medium tracking-wide">Dashboard</span>
          </button>
          <button
            onClick={() => handleNavClick('menu')}
            className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                ${activeTab === 'menu' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <UtensilsCrossed size={20} className={`mr-3 ${activeTab === 'menu' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm font-medium tracking-wide">Menu Editor</span>
          </button>
          <button
            onClick={() => handleNavClick('history')}
            className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                ${activeTab === 'history' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <History size={20} className={`mr-3 ${activeTab === 'history' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm font-medium tracking-wide">Order History</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center p-3 bg-slate-800/50 rounded mb-4 border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-serif font-bold text-sm mr-3 border border-gold/30">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate font-serif">{user.username}</p>
              <p className="text-[10px] text-slate-500 uppercase">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
          >
            <LogOut size={14} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top bar for mobile */}
        <header className="bg-ink text-white p-4 md:hidden flex justify-between items-center z-30 shadow-md">
          <button onClick={() => setIsSidebarOpen(true)} className="text-white hover:text-gold transition-colors">
            <Menu size={24} />
          </button>
          <div className="font-serif font-bold tracking-wide">SEASHELL</div>
          <button onClick={() => setUser(null)}><LogOut size={20} /></button>
        </header>

        <div className="flex-1 overflow-hidden bg-paper">
          <div className="h-full max-w-full">
            {activeTab === 'dashboard' && (
              <Dashboard orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
            )}
            {activeTab === 'menu' && (
              <MenuEditor menu={menu} onUpdate={handleMenuUpdate} />
            )}
            {activeTab === 'history' && (
              <OrderHistory />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
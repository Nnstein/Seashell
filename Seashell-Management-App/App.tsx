import React, { useState, useEffect } from 'react';
import { User, Order, MenuItem, OrderStatus } from './types';
import { getMenu, saveMenu } from './services/storageService';
import { useOrders } from './context/OrdersContext';
import Dashboard from './components/Dashboard';
import MenuEditor from './components/MenuEditor';
import Login from './components/Login';
import { LayoutDashboard, UtensilsCrossed, LogOut, Shell } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu'>('dashboard');
  const { orders, loading, updateOrderStatus } = useOrders();
  const [menu, setMenu] = useState<MenuItem[]>([]);

  // Simulate initial data load
  useEffect(() => {
    const loadData = () => {
      setMenu(getMenu());
    };
    loadData();
  }, []);

  const handleLogin = (username: string) => {
    setUser({ username, role: 'admin' });
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
  };

  const handleSaveMenu = (newMenu: MenuItem[]) => {
    saveMenu(newMenu);
    setMenu(newMenu);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-paper text-gold"><Shell className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="flex h-screen w-full bg-paper overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex flex-col items-center border-b border-slate-800">
          <div className="text-gold mb-3">
            <Shell size={32} />
          </div>
          <div className="text-center">
            <h1 className="font-serif font-bold text-xl tracking-wide">SEASHELL</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Manager Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                ${activeTab === 'dashboard' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard size={20} className={`mr-3 ${activeTab === 'dashboard' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm font-medium tracking-wide">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                ${activeTab === 'menu' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <UtensilsCrossed size={20} className={`mr-3 ${activeTab === 'menu' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm font-medium tracking-wide">Menu Editor</span>
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
          <div className="font-serif font-bold tracking-wide">SEASHELL</div>
          <button onClick={() => setUser(null)}><LogOut size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto bg-paper">
          <div className="h-full max-w-full">
            {activeTab === 'dashboard' && (
              <Dashboard orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
            )}
            {activeTab === 'menu' && (
              <MenuEditor menu={menu} onSave={handleSaveMenu} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
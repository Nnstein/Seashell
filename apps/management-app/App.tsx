import React, { useState, useEffect } from 'react';
import { User, Order, MenuItem, OrderStatus } from './src/types';
import { getMenuItems, archiveCompletedOrders } from './services/firestoreService';
import { useOrders } from './context/OrdersContext';
import Dashboard from './components/Dashboard';
import MenuEditor from './components/MenuEditor';
import OrderHistory from './components/OrderHistory';
import MealAnalytics from './components/MealAnalytics';
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';
import SectionsManager from './components/SectionsManager';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, UtensilsCrossed, LogOut, Shell, Menu, X, History, UserCog, BarChart2, MapPin } from 'lucide-react';
import { useOrderNotifications } from './hooks/useOrderNotifications';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'history' | 'analytics' | 'staff' | 'sections'>('dashboard');
  const { orders, loading, updateOrderStatus, notificationsEnabled } = useOrders();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

  // Derived permission flags — single source of truth for access control
  const isAdmin = user?.role === 'admin' || user?.role === 'admin2';
  const isSuperAdmin = user?.role === 'admin'; // Only true admin can manage staff

  // Enable notification system filtered by user role
  useOrderNotifications(notificationsEnabled, user?.role, user?.kitchenContext);

  // Monitor Auth State for persistent login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role from Firestore
        try {
          const roleSnap = await getDoc(doc(db, 'staff_roles', firebaseUser.uid));
          if (roleSnap.exists()) {
            const data = roleSnap.data();
            const role = data.role as 'admin' | 'admin2' | 'seashell' | 'room-service' | 'presto' | 'kitchen';
            // Use display name or email prefix as username
            const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Staff';
            
            // For kitchen role, try to recover context from Firestore if it exists
            const kitchenContext = data.lastContext as 'room-service' | 'seashell' | 'presto' | undefined;
            
            setUser({ username, role, kitchenContext });
          } else {
            console.error("No role found for user");
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load data from Firestore and archive old orders
  useEffect(() => {
    if (user) {
      loadMenu();
      archiveOldOrders();
    }
  }, [user]);

  const loadMenu = async () => {
    const menuItems = await getMenuItems();
    setMenu(menuItems);
  };

  const handleLogin = (
    username: string, 
    role: 'admin' | 'admin2' | 'seashell' | 'room-service' | 'presto' | 'kitchen',
    kitchenContext?: 'room-service' | 'seashell' | 'presto'
  ) => {
    setUser({ username, role, kitchenContext });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
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

  const handleNavClick = (tab: 'dashboard' | 'menu' | 'history' | 'analytics' | 'staff' | 'sections') => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (authLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-paper text-gold"><Shell className="animate-spin" size={48} /></div>;
  }

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
        fixed md:relative inset-y-0 left-0 z-40 w-64 bg-ink text-white flex flex-col shadow-2xl 
        transition-all duration-300 ease-in-out flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-64 md:translate-x-0'}
      `}>
        <div className="p-8 flex flex-col items-center border-b border-slate-800 relative">
          {/* Close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 mb-4 p-1">
            <img src="assets/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="font-serif font-bold text-lg tracking-wide text-gold">SEASHELL</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Management Portal</p>
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
          {/* Menu Editor: Admin and outlet staff (but not kitchen) */}
          {user.role !== 'kitchen' && (
            <button
              onClick={() => handleNavClick('menu')}
              className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                  ${activeTab === 'menu' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <UtensilsCrossed size={20} className={`mr-3 ${activeTab === 'menu' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="text-sm font-medium tracking-wide">Menu Editor</span>
            </button>
          )}

          {/* Order History: Admin and outlet staff (but not kitchen) */}
          {user.role !== 'kitchen' && (
              <button
                onClick={() => handleNavClick('history')}
                className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                    ${activeTab === 'history' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <History size={20} className={`mr-3 ${activeTab === 'history' ? 'text-gold' : 'text-gold group-hover:text-white'}`} />
                <span className="text-sm font-medium tracking-wide">Order History</span>
              </button>
          )}

          {/* Meal Analytics: Admin and outlet staff (but not kitchen) */}
          {user.role !== 'kitchen' && (
              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                    ${activeTab === 'analytics' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <BarChart2 size={20} className={`mr-3 ${activeTab === 'analytics' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="text-sm font-medium tracking-wide">Meal Analytics</span>
              </button>
          )}

          {/* Sections Management: Admin only */}
          {isAdmin && (
              <button
                onClick={() => handleNavClick('sections')}
                className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                    ${activeTab === 'sections' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <MapPin size={20} className={`mr-3 ${activeTab === 'sections' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="text-sm font-medium tracking-wide">Locations</span>
              </button>
          )}

          {/* Staff Management is super-admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => handleNavClick('staff')}
              className={`w-full flex items-center px-4 py-3 rounded transition-all duration-300 group
                  ${activeTab === 'staff' ? 'bg-slate-800 text-gold border-l-2 border-gold' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <UserCog size={20} className={`mr-3 ${activeTab === 'staff' ? 'text-gold' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="text-sm font-medium tracking-wide">Staff Management</span>
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center p-3 bg-slate-800/50 rounded mb-4 border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-serif font-bold text-sm mr-3 border border-gold/30">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate font-serif">{user.username}</p>
            <p className="text-[10px] text-slate-500 uppercase">
                {user.role === 'admin' ? 'Super Administrator' :
                 user.role === 'admin2' ? 'Administrator' :
                 user.role === 'kitchen' ? `Kitchen (${user.kitchenContext === 'room-service' ? 'RoomSVC' : user.kitchenContext})` :
                 user.role === 'seashell' ? 'Seashell Staff' : 
                 user.role === 'presto' ? 'Presto Staff' : 'Room Service Staff'}
            </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
          >
            <LogOut size={14} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-paper">
        {/* Top bar for mobile */}
        <header className="bg-ink text-white p-4 md:hidden flex justify-between items-center z-30 shadow-md">
          <button onClick={() => setIsSidebarOpen(true)} className="text-white hover:text-gold transition-colors">
            <Menu size={24} />
          </button>
          <div className="font-serif font-bold tracking-wide">SEASHELL</div>
          <button onClick={handleSignOut}><LogOut size={20} /></button>
        </header>

        {/* Desktop Hamburger (visible only on desktop/tablet) */}
        <div className="hidden md:flex p-4 pb-0 z-10 w-full bg-paper">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="text-slate-400 hover:text-ink transition-colors bg-white p-2 rounded-md shadow-sm border border-slate-200"
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-paper">
          {activeTab === 'dashboard' && (
            <Dashboard 
              orders={orders} 
              onUpdateStatus={handleUpdateOrderStatus} 
              userRole={user.role} 
              kitchenContext={user.kitchenContext}
            />
          )}
          {activeTab === 'menu' && user.role !== 'kitchen' && (
            <MenuEditor 
              menu={menu} 
              onUpdate={handleMenuUpdate} 
              userRole={user.role}
              isReadOnly={false}
            />
          )}
          {activeTab === 'history' && (
            <OrderHistory userRole={user.role} kitchenContext={user.kitchenContext} />
          )}
          {activeTab === 'analytics' && (
            <MealAnalytics userRole={user.role} kitchenContext={user.kitchenContext} />
          )}
          {activeTab === 'sections' && isAdmin && (
            <SectionsManager />
          )}
          {activeTab === 'staff' && isSuperAdmin && (
            <StaffManagement />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

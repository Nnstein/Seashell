import React, { createContext, useContext, useState, ReactNode, useEffect, PropsWithChildren, useMemo } from 'react';
import { getAvailableMenuItems, getMenuSettings, subscribeToMenuUpdates } from '../services/firestoreService';
import { fetchGuestOrderHistory } from '../services/guestService';
import { getCategoriesByMenu } from '../data';
import { Language, MenuItem, ViewState, GuestOrderHistoryItem } from '../src/types';
import { useCategoryImages } from '../hooks/useCategoryImages';
import { useCart, CartItem } from '../hooks/useCart';
import { useSession } from '../hooks/useSession';
import { useOrder } from '../hooks/useOrder';
import { useToast } from '../components/Toast';

// Re-export CartItem for components that need it
export type { CartItem } from '../hooks/useCart';

interface AppState {
  language: Language;
  toggleLanguage: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  cart: CartItem[];
  confirmedOrder: CartItem[];
  addToCart: (
    item: MenuItem,
    quantity?: number,
    size?: string,
    addons?: string[],
    instructions?: string,
    pricingInfo?: {
      unitPrice: number;
      effectiveTotal: number;
      originalTotal: number;
      savings: number;
      appliedBundle?: { quantity: number; price: number; label?: string };
      hasDiscount: boolean;
      hasBundlePricing: boolean;
    }
  ) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  updateInstructions: (cartId: string, instructions: string) => void;
  removeFromCart: (cartId: string) => void;
  resetOrder: () => void;
  handleCheckout: (paymentType?: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  animateCart: boolean;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  isPlacingOrder: boolean;
  clearCart: () => void;
  menuItems: MenuItem[];
  loadingMenu: boolean;
  activeSeason: 'Summer' | 'Winter';
  activeMenu: 'presto' | 'room-service' | 'seashell';
  setActiveMenu: (menu: 'presto' | 'room-service' | 'seashell') => void;
  currentMenuCategories: string[]; // Live categories from Firestore for the active menu
  categoryImages: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  chairNumber: string;
  setChairNumber: (num: string) => void;
  isBeachGuest: boolean;
  saveSession: (room: string, phone: string) => void;
  clearSession: () => void;
  expectedPreparationTime: number;
  restoreCartForSession: (roomNumber: string) => void;
  menuSettings: any; // Add the raw menu settings here for real-time menu status checks
  orderHistory: GuestOrderHistoryItem[];
  loadingOrderHistory: boolean;
  fetchOrderHistory: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  // Language & View State
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<ViewState>('HOME');
  const [activeCategory, setActiveCategory] = useState<string>('Breakfast');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Menu Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [activeSeason, setActiveSeason] = useState<'Summer' | 'Winter'>('Summer');
  // Dynamic category settings loaded from Firestore (mirrors what the management app edits)
  const [menuCategorySettings, setMenuCategorySettings] = useState<Record<string, string[]> | null>(null);

  // Order History State
  const [orderHistory, setOrderHistory] = useState<GuestOrderHistoryItem[]>([]);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);
  const [menuSettings, setMenuSettings] = useState<any>(null);

  // INITIALIZATION: Detect if we are in Beach Mode from URL
  const initialMenu = window.location.pathname.replace(/\/+/g, '/').startsWith('/beach') ? 'seashell' : 'room-service';
  const [activeMenu, setActiveMenu] = useState<'presto' | 'room-service' | 'seashell'>(initialMenu);

  // Custom Hooks
  const cartHook = useCart();
  const sessionHook = useSession();
  const { showError, showWarning, showInfo } = useToast();

  // Use the hook for dynamic images
  const categoryImages = useCategoryImages();

  // Live categories for the active menu — reads Firestore first, falls back to static defaults
  const currentMenuCategories = useMemo(() => {
    if (menuCategorySettings && menuCategorySettings[activeMenu]?.length > 0) {
      return menuCategorySettings[activeMenu];
    }
    return [...getCategoriesByMenu(activeMenu)] as string[];
  }, [menuCategorySettings, activeMenu]);

  // When the active menu (or its categories) changes, reset the selected category
  // to the first valid one so guests never land on an empty page
  useEffect(() => {
    if (currentMenuCategories.length > 0) {
      setActiveCategory(currentMenuCategories[0]);
    }
  }, [activeMenu, currentMenuCategories]);

  // Sync activeMenu when the URL path changes (e.g. user manually navigates)
  useEffect(() => {
    const syncMenuToPath = () => {
      const isBeach = window.location.pathname.replace(/\/+/g, '/').startsWith('/beach');
      if (isBeach) {
        setActiveMenu('seashell');
      } else if (!isBeach) {
        // Only switch away from seashell if we genuinely left the beach path
        setActiveMenu(prev => prev === 'seashell' ? 'room-service' : prev);
      }
    };
    window.addEventListener('popstate', syncMenuToPath);
    return () => window.removeEventListener('popstate', syncMenuToPath);
  }, []);

  // Order hook needs dependencies from other hooks + toast functions
  const orderHook = useOrder({
    cart: cartHook.cart,
    clearCart: cartHook.clearCart,
    roomNumber: sessionHook.roomNumber,
    phoneNumber: sessionHook.phoneNumber,
    chairNumber: sessionHook.chairNumber,
    isBeachGuest: sessionHook.isBeachGuest,
    activeMenu,
    setView,
    setIsCartOpen,
    showError,
    showWarning,
    showInfo
  });

  // Auto-navigate to MENU if session exists
  useEffect(() => {
    if (sessionHook.sessionLoaded && sessionHook.roomNumber) {
      setView('MENU');
    }
  }, [sessionHook.sessionLoaded, sessionHook.roomNumber]);

  // Fetch order history for the current guest
  const fetchOrderHistory = async () => {
    if (!sessionHook.roomNumber || !sessionHook.phoneNumber) {
      setOrderHistory([]);
      return;
    }
    setLoadingOrderHistory(true);
    try {
      const response = await fetchGuestOrderHistory(sessionHook.roomNumber, sessionHook.phoneNumber);
      if (response.success) {
        setOrderHistory(response.orders);
      } else {
        setOrderHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      setOrderHistory([]);
    } finally {
      setLoadingOrderHistory(false);
    }
  };

  // Load Menu from Firestore + Real-time update subscription
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const loadMenu = async (isRealtimeUpdate = false) => {
      try {
        if (!isRealtimeUpdate) setLoadingMenu(true);

        // Sequential fetch: getAvailableMenuItems() MUST run first because it checks the Firestore version
        // and updates the settings cache if a new version exists. If run concurrently via Promise.all,
        // getMenuSettings() might read stale cache before the cache is updated.
        const items = await getAvailableMenuItems();
        const settings = await getMenuSettings();

        if (settings) {
          setMenuSettings(settings); // Store the full settings object for real-time menu open/close tracking
          setActiveSeason(settings.activeSeason);
          // Load dynamic category configuration from Firestore
          if (settings.categories) {
            setMenuCategorySettings(settings.categories as Record<string, string[]>);
          }
          // NOTE: We intentionally do NOT set activeMenu from Firestore here.
          // The active menu is determined purely by the URL path + login action.
        }

        const currentSeason = settings?.activeSeason || 'Summer';

        // Filter by Season only (all menus are live and filtered by UI)
        const filteredItems = items.filter(item => {
          const seasonMatch = item.season === currentSeason || (!item.season && currentSeason === 'Summer');
          return seasonMatch;
        });

        setMenuItems(filteredItems);

        if (filteredItems.length > 0) {
          setActiveCategory('Breakfast');
        }

        if (isRealtimeUpdate) {
          console.log('✅ Menu refreshed in real-time.');
        }
      } catch (error) {
        console.error("Failed to load menu:", error);
        showError("Unable to load the menu. Please check your connection and try again.\nتعذر تحميل القائمة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.");
      } finally {
        setLoadingMenu(false);
      }
    };

    // Initial load (uses cache for fast first paint)
    loadMenu();

    // Real-time listener: listens to settings/global_settings only.
    // Costs ~0 reads when idle, 1 read per active client only when admin edits.
    unsub = subscribeToMenuUpdates(
      () => {
        loadMenu(true);
      },
      (error) => {
        console.error("Menu subscription error:", error);
        showError("Lost connection to live menu updates. Please refresh the page.\nفقد الاتصال بتحديثات القائمة المباشرة. يرجى تحديث الصفحة.");
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');

  // Calculate dynamic prep time based on pending count for the current outlet
  const pendingOrdersCount = menuSettings?.pendingCounts?.[activeMenu] || 0;
  // Base 30 mins, plus 10 mins for each additional pending order beyond the first
  const expectedPreparationTime = 30 + Math.max(0, pendingOrdersCount - 1) * 10;

  // Intercept addToCart to prevent Beach Guests from ordering Room Service items
  const handleAddToCart = React.useCallback((
      item: any,
      quantity?: number,
      size?: string,
      addons?: string[],
      instructions?: string,
      pricingInfo?: any
  ) => {
      // If a guest tries to access a room-service item from the beach
      if (sessionHook.isBeachGuest && (!item.menu || item.menu === 'room-service')) {
          showError("This item is only available for Room Service. For Beach orders, please browse the Beach Menu.\nهذا العنصر متاح فقط لخدمة الغرف. لطلبات الشاطئ، يرجى تصفح قائمة الشاطئ.");
          return;
      }
      cartHook.addToCart(item, quantity, size, addons, instructions, pricingInfo);
  }, [sessionHook.isBeachGuest, cartHook, showError]);

  return (
    <AppContext.Provider value={{
      // Language & View
      language,
      toggleLanguage,
      view,
      setView,
      activeCategory,
      setActiveCategory,
      activeMenu,
      setActiveMenu,
      currentMenuCategories,
      isCartOpen,
      setIsCartOpen,
      searchQuery,
      setSearchQuery,

      // Cart (from useCart hook)
      cart: cartHook.cart,
      addToCart: handleAddToCart,
      updateQuantity: cartHook.updateQuantity,
      updateInstructions: cartHook.updateInstructions,
      removeFromCart: cartHook.removeFromCart,
      clearCart: cartHook.clearCart,
      animateCart: cartHook.animateCart,

      // Session (from useSession hook)
      roomNumber: sessionHook.roomNumber,
      setRoomNumber: sessionHook.setRoomNumber,
      phoneNumber: sessionHook.phoneNumber,
      setPhoneNumber: sessionHook.setPhoneNumber,
      chairNumber: sessionHook.chairNumber,
      setChairNumber: sessionHook.setChairNumber,
      isBeachGuest: sessionHook.isBeachGuest,
      saveSession: sessionHook.saveSession,
      clearSession: sessionHook.clearSession,

      // Order (from useOrder hook)
      confirmedOrder: orderHook.confirmedOrder,
      isPlacingOrder: orderHook.isPlacingOrder,
      handleCheckout: orderHook.handleCheckout,
      resetOrder: orderHook.resetOrder,
      expectedPreparationTime,

      // Cart session restore
      restoreCartForSession: cartHook.restoreCartForSession,

      // Menu Data
      menuItems,
      loadingMenu,
      activeSeason,
      categoryImages,
      menuSettings,

      // Order History
      orderHistory,
      loadingOrderHistory,
      fetchOrderHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
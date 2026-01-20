import React, { createContext, useContext, useState, ReactNode, useEffect, PropsWithChildren } from 'react';
import { getAvailableMenuItems, getMenuSettings } from '../services/firestoreService';
import { Language, MenuItem, ViewState } from '../src/types';
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
  handleCheckout: (paymentMethod: 'room-charge' | 'card' | 'hesabe') => void;
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
  activeMenu: 'presto' | 'room-service';
  categoryImages: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  chairNumber: string;
  setChairNumber: (num: string) => void;
  isBeachGuest: boolean;
  saveSession: (room: string, phone: string) => void;
  clearSession: () => void;
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
  const [activeMenu, setActiveMenu] = useState<'presto' | 'room-service'>('room-service');

  // Custom Hooks
  const cartHook = useCart();
  const sessionHook = useSession();
  const { showError, showWarning, showInfo } = useToast();

  // Use the hook for dynamic images
  const categoryImages = useCategoryImages();

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

  // Load Menu from Firestore
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const [items, settings] = await Promise.all([
          getAvailableMenuItems(),
          getMenuSettings()
        ]);

        if (settings) {
          setActiveSeason(settings.activeSeason);
          setActiveMenu(settings.activeMenu || 'room-service');
        }

        const currentSeason = settings?.activeSeason || 'Summer';
        const currentMenu = settings?.activeMenu || 'room-service';

        // Filter by Season and Menu
        const filteredItems = items.filter(item => {
          const seasonMatch = item.season === currentSeason || (!item.season && currentSeason === 'Summer');
          const menuMatch = item.menu === currentMenu || (!item.menu && currentMenu === 'room-service');
          return seasonMatch && menuMatch;
        });

        setMenuItems(filteredItems);

        if (filteredItems.length > 0) {
          setActiveCategory('Breakfast');
        }
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    loadMenu();
  }, []);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');

  return (
    <AppContext.Provider value={{
      // Language & View
      language,
      toggleLanguage,
      view,
      setView,
      activeCategory,
      setActiveCategory,
      isCartOpen,
      setIsCartOpen,
      searchQuery,
      setSearchQuery,

      // Cart (from useCart hook)
      cart: cartHook.cart,
      addToCart: cartHook.addToCart,
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

      // Menu Data
      menuItems,
      loadingMenu,
      activeSeason,
      activeMenu,
      categoryImages
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
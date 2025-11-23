import React, { createContext, useContext, useState, ReactNode, useEffect, PropsWithChildren } from 'react';
import { Language, CartItem, MenuItem, ViewState } from '../types';
import { MENU_DATA } from '../data';

interface AppState {
  language: Language;
  toggleLanguage: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  cart: CartItem[];
  confirmedOrder: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  resetOrder: () => void;
  handleCheckout: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  animateCart: boolean;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  clearCart: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<ViewState>('HOME');
  const [activeCategory, setActiveCategory] = useState<string>(MENU_DATA[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, cartId: Date.now().toString() }];
    });
    
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 500);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Snapshot the current cart for the confirmation screen
    const orderToConfirm = [...cart];
    setConfirmedOrder(orderToConfirm);
    
    // Switch view FIRST
    setView('CONFIRMATION');
    
    // Close drawer
    setIsCartOpen(false);
    
    // Note: We DO NOT clear the cart here. We let the ConfirmationScreen 
    // clear it on mount. This prevents race conditions where the cart 
    // empties before the view switches, causing weird UI states.

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetOrder = () => {
    setCart([]);
    setConfirmedOrder([]);
    setRoomNumber('');
    setView('HOME'); // Go back to Landing Page
    setActiveCategory(MENU_DATA[0].id);
  };

  // Preload images for performance
  useEffect(() => {
    MENU_DATA.forEach(cat => {
      const img = new Image();
      img.src = cat.image;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      language, toggleLanguage,
      view, setView,
      activeCategory, setActiveCategory,
      cart, confirmedOrder, addToCart, updateQuantity, removeFromCart, resetOrder, handleCheckout,
      isCartOpen, setIsCartOpen,
      animateCart,
      roomNumber, setRoomNumber,
      clearCart
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
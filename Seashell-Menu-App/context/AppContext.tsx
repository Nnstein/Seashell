import React, { createContext, useContext, useState, ReactNode, useEffect, PropsWithChildren } from 'react';
import { collection, addDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';
import { db } from '../firebase';

setLogLevel('debug'); // Enable detailed logs
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
  handleCheckout: (paymentMethod: 'room_charge' | 'card') => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  animateCart: boolean;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  isPlacingOrder: boolean;
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

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCheckout = async (paymentMethod: 'room_charge' | 'card') => {
    if (cart.length === 0) return;

    if (!roomNumber) {
      alert("Please enter a room number.");
      return;
    }

    if (isPlacingOrder) return; // Prevent double clicks

    setIsPlacingOrder(true);

    try {
      console.log("DEBUG: Starting checkout process...");
      console.log("DEBUG: DB Instance:", db);

      // 1. Create the order object
      const orderData = {
        roomNumber,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: serverTimestamp(),
        language,
        paymentMethod
      };

      console.log("DEBUG: Order Data prepared:", orderData);

      // 2. Send to Firebase with Timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Check your internet connection.")), 10000)
      );

      await Promise.race([
        addDoc(collection(db, "orders"), orderData),
        timeoutPromise
      ]);

      console.log("DEBUG: Order sent to Firebase successfully.");

      // 3. Update Local State (Success)
      const orderToConfirm = [...cart];
      setConfirmedOrder(orderToConfirm);

      // 4. Navigate
      console.log("DEBUG: Navigating to CONFIRMATION view.");
      setView('CONFIRMATION');
      setIsCartOpen(false);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Error placing order: ${error.message || error}`);
    } finally {
      setIsPlacingOrder(false);
    }
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
      clearCart,
      isPlacingOrder
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
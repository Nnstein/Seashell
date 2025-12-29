import React, { createContext, useContext, useState, ReactNode, useEffect, PropsWithChildren } from 'react';
import { getAvailableMenuItems, placeOrder, getMenuSettings } from '../services/firestoreService';
import { Language, MenuItem, ViewState } from '../src/types';
import { useCategoryImages } from '../hooks/useCategoryImages';

// Define CartItem locally as it extends MenuItem with quantity
export interface CartItem extends MenuItem {
  quantity: number;
  cartId: string;
  selectedSize?: string;
  selectedAddons?: string[];
  specialInstructions?: string;
}

interface AppState {
  language: Language;
  toggleLanguage: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  cart: CartItem[];
  confirmedOrder: CartItem[];
  addToCart: (item: MenuItem, size?: string, addons?: string[], instructions?: string) => void;
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
  isPlacingOrder: boolean;
  clearCart: () => void;
  menuItems: MenuItem[];
  loadingMenu: boolean;
  activeSeason: 'Summer' | 'Winter';
  categoryImages: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  chairNumber: string;
  setChairNumber: (num: string) => void;
  isBeachGuest: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<ViewState>('HOME');
  const [activeCategory, setActiveCategory] = useState<string>('Breakfast');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeSeason, setActiveSeason] = useState<'Summer' | 'Winter'>('Summer');
  const [searchQuery, setSearchQuery] = useState('');
  const [chairNumber, setChairNumber] = useState('');

  const isBeachGuest = roomNumber.toUpperCase().startsWith('B');

  // Use the hook for dynamic images
  const categoryImages = useCategoryImages();

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
        }

        const currentSeason = settings?.activeSeason || 'Summer';

        // Filter by Season
        const filteredItems = items.filter(item =>
          item.season === currentSeason || (!item.season && currentSeason === 'Summer')
        );

        setMenuItems(filteredItems);

        // Set initial category if items exist
        if (filteredItems.length > 0) {
          // Group by category or just set default
          setActiveCategory('Breakfast'); // Updated default
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

  const addToCart = (item: MenuItem, size?: string, addons?: string[], instructions?: string) => {
    setCart(prev => {
      // Check if item with same ID AND same options exists
      const existingIndex = prev.findIndex(i =>
        i.id === item.id &&
        i.selectedSize === size &&
        JSON.stringify(i.selectedAddons?.sort()) === JSON.stringify(addons?.sort())
      );

      if (existingIndex > -1) {
        // Update quantity of existing item
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      // Add new item
      return [...prev, {
        ...item,
        quantity: 1,
        cartId: Date.now().toString(),
        selectedSize: size,
        selectedAddons: addons,
        specialInstructions: instructions
      }];
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

  const updateInstructions = (cartId: string, instructions: string) => {
    setCart(prev => prev.map(item =>
      item.cartId === cartId ? { ...item, specialInstructions: instructions } : item
    ));
  };

  const handleCheckout = async (paymentMethod: 'room-charge' | 'card' | 'hesabe') => {
    if (cart.length === 0) return;

    if (paymentMethod === 'hesabe') {
      // Integration pending backend setup per HESABE_INTEGRATION_PLAN.md
      alert("Redirecting to Hesabe Payment Gateway... (Integration Pending)");
      // TODO: Call cloud function 'initiateHesabePayment' here
      return;
    }

    if (!roomNumber) {
      alert("Please enter a room number.");
      return;
    }

    if (isBeachGuest && !chairNumber) {
      alert("Please enter your Chair/Table Number.");
      return;
    }

    if (isPlacingOrder) return;

    setIsPlacingOrder(true);

    try {
      // Prepare order items for Firestore (remove UI specific fields if needed)
      const orderItems = cart.map(item => ({
        itemId: item.id || 'unknown',
        name: item.name, // Snapshot name
        price: item.price, // Snapshot price
        quantity: item.quantity,
        notes: '' // Add notes support later if needed
      }));

      await placeOrder({
        roomNumber,
        guestName: 'Guest', // Placeholder, could be fetched if we had guest auth
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod,
        items: orderItems,
        ...(isBeachGuest && chairNumber ? { chairNumber } : {})
      });

      console.log("DEBUG: Order sent to Firestore successfully.");

      setConfirmedOrder([...cart]);
      setView('CONFIRMATION');
      setIsCartOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCart([]); // Clear cart after successful order
    } catch (error: any) {
      console.error("Error placing order: ", error);
      alert(`Error placing order: ${error.message || error}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setConfirmedOrder([]);
    setRoomNumber('');
    setView('HOME');
    setActiveCategory('Breakfast');
  };

  return (
    <AppContext.Provider value={{
      language, toggleLanguage,
      view, setView,
      activeCategory, setActiveCategory,
      cart, confirmedOrder, addToCart, updateQuantity, updateInstructions, removeFromCart, resetOrder, handleCheckout,
      isCartOpen, setIsCartOpen,
      animateCart,
      roomNumber, setRoomNumber,
      clearCart,
      isPlacingOrder,
      menuItems,
      loadingMenu,
      activeSeason,
      categoryImages,
      searchQuery,
      setSearchQuery,
      chairNumber,
      setChairNumber,
      isBeachGuest
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
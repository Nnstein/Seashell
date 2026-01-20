import { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';
import { Language, HousekeepingItem, ViewState, RequestItem, CategoryData } from '../types';
import { HOUSEKEEPING_DATA } from '../data';

interface AppState {
  language: Language;
  toggleLanguage: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  requestList: RequestItem[];
  addToRequest: (item: HousekeepingItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromRequest: (itemId: string) => void;
  submitRequest: () => void;
  isRequestOpen: boolean;
  setIsRequestOpen: (isOpen: boolean) => void;
  animateRequest: boolean;
  roomNumber: string;
  setRoomNumber: (room: string) => void;
  isSubmitting: boolean;
  clearRequest: () => void;
  housekeepingItems: HousekeepingItem[];
  categories: CategoryData[];
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<ViewState>('HOME');
  const [activeCategory, setActiveCategory] = useState<string>('Bedroom');
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [animateRequest, setAnimateRequest] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [housekeepingItems, setHousekeepingItems] = useState<HousekeepingItem[]>([]);
  const [categories] = useState<CategoryData[]>(HOUSEKEEPING_DATA);

  useEffect(() => {
    // Flatten items from categories for easier access
    const allItems = HOUSEKEEPING_DATA.flatMap(cat => cat.items);
    setHousekeepingItems(allItems);
  }, []);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');

  const addToRequest = (item: HousekeepingItem) => {
    setRequestList(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        quantity: 1
      }];
    });
    setAnimateRequest(true);
    setTimeout(() => setAnimateRequest(false), 500);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setRequestList(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0)); // Auto-remove if 0? Or keep at 1? Let's keep logic simple.
  };

  const removeFromRequest = (itemId: string) => {
    setRequestList(prev => prev.filter(item => item.itemId !== itemId));
  };

  const clearRequest = () => {
    setRequestList([]);
  };

  const submitRequest = async () => {
    if (requestList.length === 0) return;
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Request submitted:", { roomNumber, items: requestList });
      setIsSubmitting(false);
      setIsRequestOpen(false);
      clearRequest();
      alert("Request submitted successfully!"); // Replace with proper UI feedback later
    }, 1500);
  };

  return (
    <AppContext.Provider value={{
      language, toggleLanguage,
      view, setView,
      activeCategory, setActiveCategory,
      requestList, addToRequest, updateQuantity, removeFromRequest, submitRequest,
      isRequestOpen, setIsRequestOpen,
      animateRequest,
      roomNumber, setRoomNumber,
      isSubmitting,
      clearRequest,
      housekeepingItems,
      categories
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

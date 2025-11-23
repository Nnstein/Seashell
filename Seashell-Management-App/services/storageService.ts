import { MenuItem, Order } from '../types';
import { INITIAL_MENU, INITIAL_ORDERS } from '../constants';

const MENU_KEY = 'seashell_menu';
const ORDERS_KEY = 'seashell_orders';

export const getMenu = (): MenuItem[] => {
  const stored = localStorage.getItem(MENU_KEY);
  if (!stored) {
    localStorage.setItem(MENU_KEY, JSON.stringify(INITIAL_MENU));
    return INITIAL_MENU;
  }
  return JSON.parse(stored);
};

export const saveMenu = (menu: MenuItem[]) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  // Dispatch event for real-time feel if multiple tabs were open (optional polish)
  window.dispatchEvent(new Event('storage'));
};

export const getOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  return JSON.parse(stored);
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event('storage'));
};

export const updateOrderStatus = (orderId: string, status: Order['status']) => {
  const orders = getOrders();
  const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
  saveOrders(updated);
  return updated;
};

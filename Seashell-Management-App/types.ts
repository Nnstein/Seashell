import { Timestamp } from 'firebase/firestore';

export type Category = 'Starters' | 'Mains' | 'Desserts' | 'Drinks';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  available: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  name: { en: string; ar: string };
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  roomNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  language: 'en' | 'ar';
  paymentMethod: 'room_charge' | 'card';
  notes?: string; // Optional, just in case
}

export interface User {
  username: string;
  role: 'admin' | 'kitchen';
}

export interface DashboardStats {
  activeOrders: number;
  completedToday: number;
  revenueToday: number;
}
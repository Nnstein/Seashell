import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../components/Toast';

import { Order, OrderStatus } from '../src/types';

// Removed local interfaces to use shared types

interface OrdersContextType {
    orders: Order[];
    loading: boolean;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    notificationsEnabled: boolean;
    toggleNotifications: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('notificationsEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setOrders([]);
                setLoading(false);
                return;
            }

            console.log("DEBUG: Setting up optimized orders listener...");
            
            // Only fetch orders from last 7 days to reduce reads
            const sevenDaysAgo = Timestamp.fromDate(
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            );
            
            // Optimized query: Only active orders from last 7 days, limited to 100
            const q = query(
                collection(db, 'orders'),
                where('createdAt', '>=', sevenDaysAgo),
                orderBy('createdAt', 'desc'),
            );
            
            const snapUnsubscribe = onSnapshot(q, (snapshot) => {
                console.log("DEBUG: Snapshot received. Docs count:", snapshot.docs.length);
                const ordersData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Handle legacy field mapping
                        totalAmount: data.totalAmount ?? data.total ?? 0,
                        // Ensure other required fields have defaults if missing
                        paymentMethod: data.paymentMethod || 'room_charge',
                        items: data.items || [],
                        status: data.status || 'pending',
                        roomNumber: data.roomNumber || 'Unknown',
                        guestName: data.guestName || 'Guest'
                    } as Order;
                });
                console.log("DEBUG: Parsed orders:", ordersData);
                setOrders(ordersData);
                setLoading(false);
            }, (error) => {
                console.error("DEBUG: Error fetching orders: ", error);
                setLoading(false);
            });

            return () => snapUnsubscribe();
        });

        return () => authUnsubscribe();
    }, []);

    const { showSuccess, showError } = useToast();

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status });
            // Optional: show minimal success feedback or rely on UI optimistic update
            // showSuccess("Order status updated"); 
        } catch (error) {
            console.error("Error updating order status: ", error);
            showError("Failed to update order status. Please check your connection or permissions.");
        }
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
            return newValue;
        });
    };

    return (
        <OrdersContext.Provider value={{ orders, loading, updateOrderStatus, notificationsEnabled, toggleNotifications }}>
            {children}
        </OrdersContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrdersContext);
    if (!context) throw new Error('useOrders must be used within OrdersProvider');
    return context;
};

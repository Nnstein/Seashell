import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
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

    // Enable notification system
    useOrderNotifications(notificationsEnabled);

    useEffect(() => {
        console.log("DEBUG: Setting up orders listener...");
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
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

        return () => unsubscribe();
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

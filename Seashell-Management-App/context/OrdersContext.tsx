import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

import { Order, OrderStatus } from '../src/types';

// Removed local interfaces to use shared types

interface OrdersContextType {
    orders: Order[];
    loading: boolean;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

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

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status });
        } catch (error) {
            console.error("Error updating order status: ", error);
        }
    };

    return (
        <OrdersContext.Provider value={{ orders, loading, updateOrderStatus }}>
            {children}
        </OrdersContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrdersContext);
    if (!context) throw new Error('useOrders must be used within OrdersProvider');
    return context;
};

import { useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerNotification } from '../utils/notifications';

export const useOrderNotifications = (enabled: boolean = true) => {
    const lastOrderIdRef = useRef<string | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;

        // Listen to the most recent order
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            if (isInitialLoadRef.current) {
                // On first load, just store the latest order ID without notifying
                if (!snapshot.empty) {
                    lastOrderIdRef.current = snapshot.docs[0].id;
                }
                isInitialLoadRef.current = false;
                return;
            }

            // Check if there's a new order
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newOrderId = change.doc.id;

                    // Only notify if this is a genuinely new order
                    if (lastOrderIdRef.current && newOrderId !== lastOrderIdRef.current) {
                        console.log('🔔 New order received!', newOrderId);
                        triggerNotification();
                    }

                    lastOrderIdRef.current = newOrderId;
                }
            });
        });

        return () => unsubscribe();
    }, [enabled]);
};

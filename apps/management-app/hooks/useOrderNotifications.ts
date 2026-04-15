import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { startNotificationLoop, stopNotificationLoop } from '../utils/notifications';

export const useOrderNotifications = (enabled: boolean = true) => {
    const lastOrderIdRef = useRef<string | null>(null);
    const isInitialLoadRef = useRef(true);
    const hasNotifiedRef = useRef(false);

    useEffect(() => {
        if (!enabled) {
            stopNotificationLoop();
            return;
        }

        // Listen to all pending orders
        const pendingOrdersQuery = query(
            collection(db, 'orders'),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(pendingOrdersQuery, (snapshot) => {
            const pendingCount = snapshot.size;

            if (isInitialLoadRef.current) {
                // On first load, just store state without notifying
                isInitialLoadRef.current = false;
                hasNotifiedRef.current = pendingCount > 0;

                // Start loop if there are pending orders on initial load
                if (pendingCount > 0) {
                    startNotificationLoop();
                }
                return;
            }

            // Check for new orders
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newOrderId = change.doc.id;

                    // Only notify if this is a genuinely new order
                    if (lastOrderIdRef.current && newOrderId !== lastOrderIdRef.current) {
                        console.log('🔔 New order received!', newOrderId);
                    }

                    lastOrderIdRef.current = newOrderId;
                }
            });

            // Control notification loop based on pending orders
            if (pendingCount > 0) {
                // There are pending orders - ensure notification is looping
                if (!hasNotifiedRef.current) {
                    console.log(`🔔 Starting notification loop - ${pendingCount} pending order(s)`);
                    startNotificationLoop();
                    hasNotifiedRef.current = true;
                }
            } else {
                // No pending orders - stop the loop
                if (hasNotifiedRef.current) {
                    console.log('✅ All orders processed - stopping notification loop');
                    stopNotificationLoop();
                    hasNotifiedRef.current = false;
                }
            }
        });

        return () => {
            unsubscribe();
            stopNotificationLoop();
        };
    }, [enabled]);
};

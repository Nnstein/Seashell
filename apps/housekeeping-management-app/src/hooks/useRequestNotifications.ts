import { useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, QuerySnapshot, DocumentChange } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerNotification } from '../utils/notifications';

export const useRequestNotifications = (enabled: boolean = true) => {
    const lastRequestIdRef = useRef<string | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (!enabled) return;

        // Listen to the most recent housekeeping request
        const requestsQuery = query(
            collection(db, 'housekeeping_requests'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(requestsQuery, (snapshot: QuerySnapshot) => {
            if (isInitialLoadRef.current) {
                // On first load, just store the latest request ID without notifying
                if (!snapshot.empty) {
                    lastRequestIdRef.current = snapshot.docs[0].id;
                }
                isInitialLoadRef.current = false;
                return;
            }

            // Check if there's a new request
            snapshot.docChanges().forEach((change: DocumentChange) => {
                if (change.type === 'added') {
                    const newRequestId = change.doc.id;

                    // Only notify if this is a genuinely new request
                    if (lastRequestIdRef.current && newRequestId !== lastRequestIdRef.current) {
                        console.log('🔔 New housekeeping request received!', newRequestId);
                        triggerNotification();
                    }

                    lastRequestIdRef.current = newRequestId;
                }
            });
        });

        return () => unsubscribe();
    }, [enabled]);
};

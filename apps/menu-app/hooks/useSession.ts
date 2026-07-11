import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'seashell_guest_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface Session {
    roomNumber: string;
    phoneNumber: string;
    expiresAt: number;
}

export const useSession = () => {
    const [roomNumber, setRoomNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [chairNumber, setChairNumber] = useState('');
    const [sessionLoaded, setSessionLoaded] = useState(false);

    const isBeachGuest = roomNumber.toUpperCase().startsWith('SB');

    // Save session to localStorage
    const saveSession = useCallback((room: string, phone: string) => {
        const session: Session = {
            roomNumber: room,
            phoneNumber: phone,
            expiresAt: Date.now() + SESSION_DURATION
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }, []);

    // Load session from localStorage
    const loadSession = useCallback((): Session | null => {
        try {
            const sessionStr = localStorage.getItem(SESSION_KEY);
            if (!sessionStr) return null;

            const session: Session = JSON.parse(sessionStr);
            if (Date.now() > session.expiresAt) {
                // Session expired
                localStorage.removeItem(SESSION_KEY);
                return null;
            }

            return session;
        } catch (error) {
            console.error('Error loading session:', error);
            return null;
        }
    }, []);

    // Clear session
    const clearSession = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        setRoomNumber('');
        setPhoneNumber('');
        setChairNumber('');
    }, []);

    // Auto-restore session on mount — but only if the session type matches the current route.
    // A beach session (SB prefix) is only valid on /beach.
    // A room/presto session is only valid on /.
    // Mismatches are cleared so the correct login page is shown.
    useEffect(() => {
        const session = loadSession();
        if (session) {
            const isBeachPath = window.location.pathname.replace(/\/+/g, '/').startsWith('/beach');
            const isBeachSession = session.roomNumber.toUpperCase().startsWith('SB');

            if (isBeachPath === isBeachSession) {
                // Session type matches the route — restore it
                setRoomNumber(session.roomNumber);
                setPhoneNumber(session.phoneNumber);
            } else {
                // Mismatch: clear the stale session so the login page appears
                localStorage.removeItem(SESSION_KEY);
            }
        }
        setSessionLoaded(true);
    }, [loadSession]);

    return {
        roomNumber,
        setRoomNumber,
        phoneNumber,
        setPhoneNumber,
        chairNumber,
        setChairNumber,
        isBeachGuest,
        saveSession,
        clearSession,
        sessionLoaded
    };
};

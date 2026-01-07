// Notification sound utility with looping support
// Handles browser autoplay restrictions with user interaction unlock

let notificationAudio: HTMLAudioElement | null = null;
let vibrationInterval: number | null = null;
let audioUnlocked = false;

// Get the base URL from Vite (handles /management/ subdirectory)
const getAudioPath = () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    return `${baseUrl}notification/new-order-notification.mp3`;
};

// Initialize audio element
const initAudio = () => {
    if (!notificationAudio) {
        const audioPath = getAudioPath();
        console.log('🔊 Loading audio from:', audioPath);
        notificationAudio = new Audio(audioPath);
        notificationAudio.loop = true;
        notificationAudio.volume = 1.0;

        // Preload the audio
        notificationAudio.load();

        console.log('🔊 Notification audio initialized');
    }
    return notificationAudio;
};

// Unlock audio playback (must be called from user interaction)
export const unlockAudio = async (): Promise<boolean> => {
    try {
        const audio = initAudio();

        // Play and immediately pause to unlock
        audio.muted = true;
        await audio.play();
        audio.pause();
        audio.muted = false;
        audio.currentTime = 0;

        audioUnlocked = true;
        console.log('🔓 Audio unlocked successfully');
        return true;
    } catch (error) {
        console.warn('Could not unlock audio:', error);
        return false;
    }
};

// Check if audio is unlocked
export const isAudioUnlocked = () => audioUnlocked;

export const playNotificationSound = () => {
    try {
        const audio = initAudio();

        if (!audioUnlocked) {
            console.warn('⚠️ Audio not unlocked yet. User interaction required.');
            // Try to play anyway in case browser allows it
        }

        // Play the audio
        audio.play()
            .then(() => {
                console.log('🔊 Playing notification sound');
            })
            .catch(error => {
                console.warn('Could not play notification sound:', error.message);
                // Fallback: Try browser notification
                showBrowserNotification();
            });
    } catch (error) {
        console.warn('Could not initialize notification sound:', error);
    }
};

export const stopNotificationSound = () => {
    try {
        if (notificationAudio) {
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
            console.log('🔇 Notification sound stopped');
        }
    } catch (error) {
        console.warn('Could not stop notification sound:', error);
    }
};

export const vibrateDevice = () => {
    try {
        if ('vibrate' in navigator) {
            // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms
            navigator.vibrate([200, 100, 200]);
        }
    } catch (error) {
        // Silent fail - vibration not available on desktop
    }
};

export const startVibrationLoop = () => {
    stopVibrationLoop(); // Clear any existing interval

    // Vibrate immediately
    vibrateDevice();

    // Then vibrate every 3 seconds
    vibrationInterval = window.setInterval(() => {
        vibrateDevice();
    }, 3000);
};

export const stopVibrationLoop = () => {
    if (vibrationInterval !== null) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }
};

export const startNotificationLoop = () => {
    playNotificationSound();
    startVibrationLoop();
};

export const stopNotificationLoop = () => {
    stopNotificationSound();
    stopVibrationLoop();
};

// Legacy function for backward compatibility
export const triggerNotification = () => {
    playNotificationSound();
    vibrateDevice();
};

// Browser notification fallback for when audio is blocked
export const showBrowserNotification = () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification('🍽️ New Order!', {
            body: 'A new order has been placed.',
            icon: '/logo.png',
            requireInteraction: true
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('🍽️ New Order!', {
                    body: 'A new order has been placed.',
                    icon: '/logo.png'
                });
            }
        });
    }
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

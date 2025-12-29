// Notification sound utility with looping support
let notificationAudio: HTMLAudioElement | null = null;
let vibrationInterval: number | null = null;

export const playNotificationSound = () => {
    try {
        if (!notificationAudio) {
            notificationAudio = new Audio('/notification/new-order-notification.mp3');
            notificationAudio.loop = true;
        }

        // Play the audio
        notificationAudio.play().catch(error => {
            console.warn('Could not play notification sound:', error);
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
        console.warn('Could not vibrate device:', error);
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

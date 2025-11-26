import { useState, useEffect } from 'react';
import { MENU_DATA } from '../data';

export const useCategoryImages = () => {
    const [currentImages, setCurrentImages] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        MENU_DATA.forEach(cat => {
            initial[cat.id] = cat.images && cat.images.length > 0 ? cat.images[0] : cat.image;
        });
        return initial;
    });

    useEffect(() => {
        const intervals: NodeJS.Timeout[] = [];
        const timeouts: NodeJS.Timeout[] = [];

        MENU_DATA.forEach((cat, index) => {
            if (cat.images && cat.images.length > 1) {
                // Stagger the start times to prevent all images changing at once
                // Use a prime number multiplier to avoid synchronization patterns
                const delay = index * 2300;

                const timeout = setTimeout(() => {
                    // Rotate every 15 seconds
                    const interval = setInterval(() => {
                        setCurrentImages(prev => {
                            const currentSrc = prev[cat.id];
                            const currentIndex = cat.images!.indexOf(currentSrc);
                            // If current image not found (shouldn't happen), default to 0
                            const nextIndex = (currentIndex + 1) % cat.images!.length;
                            return {
                                ...prev,
                                [cat.id]: cat.images![nextIndex]
                            };
                        });
                    }, 15000);
                    intervals.push(interval);
                }, delay);

                timeouts.push(timeout);
            }
        });

        return () => {
            intervals.forEach(clearInterval);
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return currentImages;
};

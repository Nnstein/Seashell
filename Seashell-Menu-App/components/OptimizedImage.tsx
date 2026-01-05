import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderColor?: string;
    aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
    priority?: boolean;
}

/**
 * Optimized image component with:
 * - Lazy loading (intersection observer)
 * - Smooth fade-in transition
 * - Placeholder background color
 * - Error fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    placeholderColor = '#e7e5e4', // stone-200
    aspectRatio = 'auto',
    priority = false
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '100px', // Start loading 100px before visible
                threshold: 0.01
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    const aspectRatioClass = {
        'square': 'aspect-square',
        '4/3': 'aspect-[4/3]',
        '16/9': 'aspect-video',
        'auto': ''
    }[aspectRatio];

    // Fallback image for errors
    const fallbackSrc = `https://via.placeholder.com/400x300/e7e5e4/a8a29e?text=${encodeURIComponent(alt.slice(0, 20))}`;

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${aspectRatioClass} ${className}`}
            style={{ backgroundColor: placeholderColor }}
        >
            {/* Placeholder shimmer effect */}
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}

            {/* Actual image */}
            {isInView && (
                <img
                    src={hasError ? fallbackSrc : src}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`
            w-full h-full object-cover
            transition-opacity duration-500 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
                />
            )}
        </div>
    );
};

export default OptimizedImage;

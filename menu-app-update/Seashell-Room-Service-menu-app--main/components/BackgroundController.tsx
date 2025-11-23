import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MENU_DATA, LANDING_IMAGE } from '../data';

interface BackgroundMedia {
  type: 'video' | 'image';
  src: string;
}

const BackgroundController: React.FC = () => {
  const { view, activeCategory } = useApp();

  // Calculate target media
  const targetMedia: BackgroundMedia = useMemo(() => {
    if (view === 'HOME') {
      return { type: 'image', src: LANDING_IMAGE };
    }
    const cat = MENU_DATA.find(c => c.id === activeCategory) || MENU_DATA[0];
    // Removed the w=1200 forced upgrade to use the lower weight images for faster loading as requested
    return { type: 'image', src: cat.image };
  }, [view, activeCategory]);

  // Two layers for cross-fading
  const [layers, setLayers] = useState<BackgroundMedia[]>([targetMedia, targetMedia]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  useEffect(() => {
    const currentActive = layers[activeIdx];
    
    // If target is same as current active, do nothing
    if (targetMedia.src === currentActive.src) return;
    
    // If already loading this specific target, do nothing
    if (pendingSrc === targetMedia.src) return;

    // Prepare the "next" layer
    const nextIdx = (activeIdx + 1) % 2;
    setPendingSrc(targetMedia.src);
    
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[nextIdx] = targetMedia;
      return newLayers;
    });

    // For video, we simulate load after a short delay
    if (targetMedia.type === 'video') {
      const timeout = setTimeout(() => {
        setActiveIdx(nextIdx);
        setPendingSrc(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [targetMedia, activeIdx, layers, pendingSrc]);

  const handleImageLoad = (idx: number) => {
    // Only switch layers if this is the layer we are waiting for
    if (layers[idx].src === pendingSrc) {
      setActiveIdx(idx);
      setPendingSrc(null);
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden">
      {[0, 1].map((idx) => {
        const isActive = activeIdx === idx;
        const layer = layers[idx];
        
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: isActive ? 1 : 0 }}
          >
            {layer.type === 'video' ? (
              <video
                className="w-full h-full object-cover"
                src={layer.src}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                className="w-full h-full object-cover scale-105"
                src={layer.src}
                alt="background"
                onLoad={() => handleImageLoad(idx)}
                onError={() => {
                   // Force transition on error so screen isn't permanently black/stuck
                   console.error("Background Load Failed", layer.src);
                   handleImageLoad(idx); 
                }}
              />
            )}
          </div>
        );
      })}
      
      {/* Global Overlays */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10 pointer-events-none"></div>
    </div>
  );
};

export default React.memo(BackgroundController);
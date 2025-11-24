import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { MenuItem, Language } from '../src/types';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem, size?: string, addons?: string[], instructions?: string) => void;
  theme: string;
  language: Language;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAdd, theme, language }) => {
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState(item.price);

  // Initialize default size if available
  useEffect(() => {
    if (item.sizes && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0].name);
    }
  }, [item.sizes]);

  // Update price when selections change
  useEffect(() => {
    let price = item.price;

    // If sizes exist, use the selected size price instead of base price (assuming size price is absolute)
    if (item.sizes && selectedSize) {
      const sizeObj = item.sizes.find(s => s.name === selectedSize);
      if (sizeObj) {
        price = sizeObj.price;
      }
    }

    // Add addons prices
    if (item.addons && selectedAddons.length > 0) {
      item.addons.forEach(addon => {
        if (selectedAddons.includes(addon.name)) {
          price += addon.price;
        }
      });
    }

    setCurrentPrice(price);
  }, [item.price, item.sizes, item.addons, selectedSize, selectedAddons]);

  const handleAddonToggle = (addonName: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonName)
        ? prev.filter(n => n !== addonName)
        : [...prev, addonName]
    );
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a modified item with the calculated price for the cart
    // or pass details to addToCart to handle it.
    // AppContext addToCart signature: (item, size, addons, instructions)
    // We pass the original item, and let the context/cart handle the price?
    // Wait, AppContext addToCart logic (which I haven't fully seen updated for price calc) needs to handle this.
    // Actually, I should probably pass the calculated price or let the cart calculate it.
    // For now, I'll pass the details.

    // Construct a temporary item with the *current* price to ensure cart reflects what user saw?
    // Or better, pass the details and let the cart logic (which I need to verify) handle it.
    // The AppContext addToCart I updated in step 755 takes (item, size, addons, instructions).
    // But I didn't update the *implementation* of addToCart in AppContext to use these params!
    // I only updated the interface.
    // I need to go back and update AppContext implementation later.
    // For now, I will implement onAdd here assuming AppContext will be fixed.

    // To make sure price is correct in cart, I might need to override the item's price in the object passed.
    const itemToAdd = { ...item, price: currentPrice };
    onAdd(itemToAdd, selectedSize, selectedAddons, '');

    // Reset selections (optional, maybe keep them?)
    setSelectedAddons([]);
    if (item.sizes && item.sizes.length > 0) setSelectedSize(item.sizes[0].name);
  };

  // Helper to get localized string
  const getName = () => {
    if (typeof item.name === 'object' && item.name !== null) {
      return (item.name as any)[language] || (item.name as any)['en'] || '';
    }
    return item.name;
  };

  const getDescription = () => {
    if (typeof item.description === 'object' && item.description !== null) {
      return (item.description as any)[language] || (item.description as any)['en'] || '';
    }
    return item.description;
  };

  const getImage = () => {
    // Use first image from images array if available, else legacy image
    if (item.images && item.images.length > 0) return item.images[0];
    return item.imageUrl || item.image || `https://source.unsplash.com/featured/?food,${item.category}`;
  };

  const accentColor = "bg-gold";

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group flex flex-col h-full border border-white/20 relative sm:hover:-translate-y-2">

      {/* Image Section */}
      <div className="relative w-full h-48 sm:h-56 overflow-hidden flex-shrink-0">
        <img
          src={getImage()}
          alt={getName()}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity duration-300"></div>

        {/* Price Tag */}
        <div className="absolute bottom-4 right-4">
          <span className={`font-sans font-bold text-lg text-white ${accentColor} px-3 py-1 rounded-full shadow-sm`}>
            {currentPrice.toFixed(3)} KD
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 flex flex-col flex-grow relative">
        <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight mb-2">{getName()}</h3>
        <p className="text-stone-600 text-sm leading-relaxed font-sans line-clamp-2 mb-4">{getDescription()}</p>

        {/* Customization Options */}
        <div className="space-y-3 mb-4 flex-grow">
          {/* Sizes */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size.name); }}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${selectedSize === size.name ? 'bg-gold text-white border-gold' : 'bg-transparent text-stone-500 border-stone-300 hover:border-gold'}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {item.addons.map((addon) => (
                  <button
                    key={addon.name}
                    onClick={(e) => { e.stopPropagation(); handleAddonToggle(addon.name); }}
                    className={`px-2 py-1 text-xs rounded border flex items-center gap-1 transition-colors ${selectedAddons.includes(addon.name) ? 'bg-gold/10 text-gold border-gold' : 'bg-transparent text-stone-500 border-stone-200 hover:border-gold/50'}`}
                  >
                    {selectedAddons.includes(addon.name) && <Check size={10} />}
                    {addon.name} (+{addon.price.toFixed(3)})
                  </button>
                ))}
              </div>
            </div>
          )}
          {item.note && (
            <p className="text-xs text-stone-400 italic mt-2">{item.note}</p>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className={`w-full ${accentColor} text-white py-3 rounded-xl shadow-lg transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-bold tracking-wide mt-auto`}
        >
          <Plus size={20} />
          <span>Add to Order</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(MenuItemCard);
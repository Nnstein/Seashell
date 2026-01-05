import React from 'react';
import { Flame, Leaf, Nut, UtensilsCrossed } from 'lucide-react';

interface MenuLegendProps {
    language: 'en' | 'ar';
}

const MenuLegend: React.FC<MenuLegendProps> = ({ language }) => {
    const legends = {
        en: [
            { icon: <Flame size={10} className="text-red-500" />, label: "Spicy" },
            { icon: <Leaf size={10} className="text-green-500" />, label: "Vegetarian" },
            { icon: <Nut size={10} className="text-amber-600" />, label: "Nuts" },
            { icon: <UtensilsCrossed size={10} className="text-purple-600" />, label: "Traditional" }
        ],
        ar: [
            { icon: <Flame size={10} className="text-red-500" />, label: "حار" },
            { icon: <Leaf size={10} className="text-green-500" />, label: "نباتي" },
            { icon: <Nut size={10} className="text-amber-600" />, label: "مكسرات" },
            { icon: <UtensilsCrossed size={10} className="text-purple-600" />, label: "تقليدي" }
        ]
    };

    const items = legends[language];

    return (
        <div className="flex flex-wrap items-center justify-center gap-3 py-1.5 px-2 bg-stone-50/80 border-b border-stone-200/50 text-[10px] sm:text-xs">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 text-stone-600">
                    {item.icon}
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default MenuLegend;

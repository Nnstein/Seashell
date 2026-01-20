import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search menu...' }) => {
    return (
        <div className="relative w-full">
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-slate-200 rounded-full 
                     focus:border-gold focus:ring-0 outline-none bg-white shadow-md
                     transition-all duration-300 placeholder-slate-400 text-slate-900
                     hover:shadow-lg focus:shadow-xl cursor-text"
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 
                       hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label="Clear search"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;

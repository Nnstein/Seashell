import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search...' }) => {
    return (
        <div className="relative w-full">
            <div className="relative">
                <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={18}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-10 py-2.5 text-sm border-2 border-slate-200 rounded-lg
                     focus:border-gold focus:ring-0 outline-none bg-white shadow-sm
                     transition-all duration-300 placeholder-slate-400
                     hover:border-slate-300 focus:shadow-md font-sans"
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 
                       hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;

import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { CATEGORIES } from '../constants';
import { generateMenuDescription } from '../services/geminiService';
import { X, Plus, Sparkles, Loader2, Image as ImageIcon, DollarSign, Edit3, Trash2 } from 'lucide-react';

interface MenuEditorProps {
  menu: MenuItem[];
  onSave: (updatedMenu: MenuItem[]) => void;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ menu, onSave }) => {
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      price: 0,
      category: 'Mains',
      image: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
      available: true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const newMenu = menu.filter(i => i.id !== id);
      onSave(newMenu);
    }
  };

  const handleSaveModal = () => {
    if (!editingItem || !editingItem.name) return;
    
    const existingIndex = menu.findIndex(i => i.id === editingItem.id);
    let newMenu = [...menu];
    
    if (existingIndex >= 0) {
      newMenu[existingIndex] = editingItem as MenuItem;
    } else {
      newMenu.push(editingItem as MenuItem);
    }
    
    onSave(newMenu);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleGenerateAI = async () => {
    if (!editingItem?.name) {
        alert("Please enter a dish name first.");
        return;
    }
    setIsGenerating(true);
    const context = editingItem.description || "Fresh ingredients";
    const result = await generateMenuDescription(editingItem.name, context);
    
    if (result) {
        setEditingItem(prev => ({
            ...prev,
            description: result.description,
            price: prev?.price || result.suggestedPrice
        }));
    } else {
        alert("Could not generate content. Check API key or try again.");
    }
    setIsGenerating(false);
  };

  const filteredMenu = filterCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === filterCategory);

  return (
    <div className="h-full flex flex-col p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold text-ink">Menu Curation</h2>
            <p className="text-slate-500 font-serif italic mt-1">Design the guest dining experience</p>
        </div>
        <button 
            onClick={handleAddNew}
            className="bg-ink text-white hover:bg-gold hover:text-ink px-6 py-3 transition-colors font-bold uppercase tracking-wider text-xs flex items-center shadow-lg"
        >
            <Plus size={16} className="mr-2" /> Add Dish
        </button>
      </div>

      {/* Categories */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 border-b border-slate-200/60">
        <button 
            onClick={() => setFilterCategory('All')}
            className={`px-6 py-2 font-serif text-sm transition-all ${filterCategory === 'All' ? 'bg-ink text-white' : 'text-slate-400 hover:text-ink hover:bg-white'}`}
        >
            All Collection
        </button>
        {CATEGORIES.map(cat => (
            <button 
                key={cat}
                onClick={() => setFilterCategory(cat as Category)}
                className={`px-6 py-2 font-serif text-sm transition-all ${filterCategory === cat ? 'bg-ink text-white' : 'text-slate-400 hover:text-ink hover:bg-white'}`}
            >
                {cat}
            </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-y-auto pb-20">
        {filteredMenu.map(item => (
            <div key={item.id} className="bg-white p-4 group hover:shadow-xl transition-all duration-500 border border-slate-100 relative flex flex-col">
                <div className="h-48 overflow-hidden mb-4 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                    <div className="absolute inset-0 border-4 border-white/20 pointer-events-none"></div>
                    
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-black/5 transition-all duration-300 opacity-0 group-hover:opacity-100 flex justify-between items-start p-3 z-10">
                         <span className="bg-white/95 backdrop-blur text-ink text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-sm border border-slate-100 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                            {item.category}
                         </span>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                            className="bg-white text-ink p-2 rounded-full hover:bg-gold hover:text-white transition-colors shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                            title="Edit Dish"
                         >
                            <Edit3 size={16} />
                        </button>
                    </div>

                    {!item.available && (
                         <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none z-20">
                            <span className="font-bold text-ink uppercase tracking-widest border-2 border-ink px-3 py-1">Sold Out</span>
                         </div>
                    )}
                </div>
                
                <div className="flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif font-bold text-lg text-ink leading-tight group-hover:text-gold transition-colors">{item.name}</h3>
                        <span className="font-serif font-bold text-ink ml-2">${item.price}</span>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-3 font-light leading-relaxed">{item.description}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-paper w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-gold animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                <div className="p-8 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-paper z-10">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-ink">{editingItem.id?.length! > 5 ? 'Edit Masterpiece' : 'New Creation'}</h3>
                        <p className="text-slate-500 italic font-serif text-sm">Refine the culinary details</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-ink transition-colors"><X size={24} /></button>
                </div>
                
                <div className="p-8 space-y-6">
                    {/* High contrast input group */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Dish Name</label>
                        <input 
                            type="text" 
                            value={editingItem.name} 
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full p-3 border-2 border-slate-300 text-ink font-serif text-lg placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white transition-colors shadow-sm"
                            placeholder="e.g. Truffle Risotto"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Category</label>
                            <div className="relative">
                                <select 
                                    value={editingItem.category} 
                                    onChange={e => setEditingItem({...editingItem, category: e.target.value as Category})}
                                    className="w-full p-3 border-2 border-slate-300 text-ink font-sans bg-white focus:border-gold focus:ring-0 outline-none appearance-none cursor-pointer shadow-sm"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Price (USD)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-4 text-slate-400" />
                                <input 
                                    type="number" 
                                    value={editingItem.price} 
                                    onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                    className="w-full pl-8 p-3 border-2 border-slate-300 text-ink font-serif font-bold text-lg bg-white focus:border-gold focus:ring-0 outline-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider">Description</label>
                            <button 
                                onClick={handleGenerateAI}
                                disabled={isGenerating || !editingItem.name}
                                className="text-xs flex items-center text-gold hover:text-amber-600 font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                            >
                                {isGenerating ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                                {isGenerating ? 'Crafting...' : 'AI Enhance'}
                            </button>
                        </div>
                        <textarea 
                            value={editingItem.description} 
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                            rows={4}
                            className="w-full p-3 border-2 border-slate-300 text-ink font-sans leading-relaxed placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white shadow-sm resize-none"
                            placeholder="Describe the dish ingredients..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Image URL</label>
                        <div className="flex gap-2">
                             <div className="relative flex-1">
                                <ImageIcon size={16} className="absolute left-3 top-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={editingItem.image} 
                                    onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                                    className="w-full pl-8 p-3 border-2 border-slate-300 text-ink bg-white focus:border-gold focus:ring-0 outline-none shadow-sm text-sm"
                                />
                            </div>
                        </div>
                        {editingItem.image && (
                            <div className="mt-4 h-40 w-full overflow-hidden border-2 border-white shadow-md">
                                <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                     
                     <div className="flex items-center gap-3 pt-2 p-4 bg-slate-100 border border-slate-200">
                        <input 
                            type="checkbox" 
                            id="available" 
                            checked={editingItem.available}
                            onChange={e => setEditingItem({...editingItem, available: e.target.checked})}
                            className="w-5 h-5 text-gold rounded focus:ring-gold border-slate-400 cursor-pointer"
                        />
                        <label htmlFor="available" className="text-sm font-bold text-ink uppercase tracking-wide cursor-pointer">Available for ordering</label>
                     </div>

                </div>
                
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <button 
                        onClick={() => handleDelete(editingItem.id!)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest flex items-center"
                    >
                        <Trash2 size={14} className="mr-1" /> Remove
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 text-slate-500 hover:text-ink font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveModal}
                            className="px-8 py-3 bg-ink hover:bg-gold hover:text-ink text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditor;
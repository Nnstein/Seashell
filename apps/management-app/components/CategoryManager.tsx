import React, { useState } from 'react';
import { MenuSettings, MenuItem } from '../src/types';
import { updateMenuSettings, updateMenuItem } from '../services/firestoreService';
import { ROOM_SERVICE_CATEGORIES, PRESTO_CATEGORIES, SEASHELL_CATEGORIES } from '../src/menuCategories';
import { X, Plus, Edit3, Trash2, Save, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from './Toast';

interface CategoryManagerProps {
    settings: MenuSettings;
    menuItems: MenuItem[];
    onUpdate: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ settings, menuItems, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'room-service' | 'presto' | 'seashell'>(settings.activeMenu);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');
    const { showSuccess, showError, showWarning } = useToast();

    // Get current categories from settings or fall back to defaults
    const getCategories = (menu: 'room-service' | 'presto' | 'seashell'): string[] => {
        if (settings.categories && settings.categories[menu]) {
            return settings.categories[menu]!;
        }
        // Fallback to static defaults if not yet in Firestore
        if (menu === 'room-service') return [...ROOM_SERVICE_CATEGORIES];
        if (menu === 'presto') return [...PRESTO_CATEGORIES];
        return [...SEASHELL_CATEGORIES];
    };

    const currentCategories = getCategories(activeTab);

    const handleSaveCategories = async (newCategories: string[]) => {
        try {
            const updatedCategories = {
                ...(settings.categories || {}),
                [activeTab]: newCategories
            };
            await updateMenuSettings({ categories: updatedCategories });
            onUpdate();
        } catch (error) {
            console.error("Error saving categories:", error);
            showError("Failed to save categories.");
            throw error;
        }
    };

    const handleAdd = async () => {
        if (!newValue.trim()) return;
        if (currentCategories.includes(newValue.trim())) {
            showWarning("Category already exists.");
            return;
        }
        try {
            const updated = [...currentCategories, newValue.trim()];
            await handleSaveCategories(updated);
            showSuccess("Category added successfully");
            setNewValue('');
            setIsAdding(false);
        } catch (error) {
            // Error handled in handleSaveCategories
        }
    };

    const handleRename = async (oldName: string, newName: string) => {
        if (!newName.trim() || oldName === newName) {
            setEditingIndex(null);
            return;
        }

        if (currentCategories.includes(newName.trim())) {
            showWarning("Category already exists.");
            return;
        }

        try {
            // 1. Update categories list
            const updated = currentCategories.map(cat => cat === oldName ? newName.trim() : cat);
            await handleSaveCategories(updated);

            // 2. Update all items using this category
            const itemsToUpdate = menuItems.filter(item => item.menu === activeTab && item.category === oldName);
            
            if (itemsToUpdate.length > 0) {
                for (const item of itemsToUpdate) {
                    if (item.id) {
                        await updateMenuItem(item.id, { category: newName.trim() });
                    }
                }
            }

            setEditingIndex(null);
            onUpdate();
            showSuccess("Category renamed successfully");
        } catch (error) {
            console.error("Error renaming category", error);
            showError("Failed to rename category completely");
        }
    };

    const handleDelete = async (catName: string) => {
        const itemsInCategory = menuItems.filter(item => item.menu === activeTab && item.category === catName);
        
        if (itemsInCategory.length > 0) {
            showError(`Cannot delete category. Please move or delete the remaining items in '${catName}' before removing it.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete "${catName}"?`)) {
            try {
                const updated = currentCategories.filter(cat => cat !== catName);
                await handleSaveCategories(updated);
                onUpdate();
                showSuccess("Category deleted successfully");
            } catch (error) {
                console.error("Error deleting category", error);
                showError("Failed to delete category completely", error instanceof Error ? error.message : String(error));
            }
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newCategories = [...currentCategories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newCategories.length) return;
        
        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
        
        try {
            await handleSaveCategories(newCategories);
        } catch (error) {
            // Error is handled in handleSaveCategories
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
                    Category Management
                </h3>
                <p className="text-slate-500 text-sm italic">Organize your menu structure and flow</p>
            </div>

            {/* Menu Selector Tabs */}
            <div className="flex border-b border-slate-100">
                {(['room-service', 'presto', 'seashell'] as const).map(menu => (
                    <button
                        key={menu}
                        onClick={() => {
                            setActiveTab(menu);
                            setEditingIndex(null);
                            setIsAdding(false);
                        }}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === menu 
                            ? 'bg-white text-gold border-b-2 border-gold' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {menu === 'room-service' ? 'Room Service' : menu.charAt(0).toUpperCase() + menu.slice(1)}
                    </button>
                ))}
            </div>

            <div className="p-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentCategories.map((cat, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group border border-transparent hover:border-slate-200 transition-all">
                            <div className="flex-1 flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-300 w-4">{index + 1}</span>
                                {editingIndex === index ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        className="flex-1 bg-white border-2 border-gold px-2 py-1 text-sm outline-none rounded"
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleRename(cat, editValue)}
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-ink">{cat}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleMove(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 text-slate-400 hover:text-gold hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button 
                                    onClick={() => handleMove(index, 'down')}
                                    disabled={index === currentCategories.length - 1}
                                    className="p-1.5 text-slate-400 hover:text-gold hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Down"
                                >
                                    <ChevronDown size={16} />
                                </button>

                                <div className="w-px h-4 bg-slate-200 mx-1" />

                                {editingIndex === index ? (
                                    <button 
                                        onClick={() => handleRename(cat, editValue)}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                    >
                                        <Save size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setEditingIndex(index);
                                            setEditValue(cat);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-gold hover:bg-white rounded"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDelete(cat)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">
                                {menuItems.filter(item => item.menu === activeTab && item.category === cat).length} items
                            </div>
                        </div>
                    ))}

                    {isAdding ? (
                        <div className="flex items-center gap-2 p-3 bg-gold/5 border-2 border-dashed border-gold rounded-lg">
                            <input
                                type="text"
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                placeholder="New category name..."
                                className="flex-1 bg-white border border-gold px-2 py-1 text-sm outline-none rounded"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            />
                            <button 
                                onClick={handleAdd}
                                className="bg-gold text-white p-1.5 rounded hover:bg-gold/90"
                            >
                                <Plus size={16} />
                            </button>
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="text-slate-400 p-1.5 hover:text-red-500"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all"
                        >
                            <Plus size={16} /> Add New Category
                        </button>
                    )}
                </div>

                {menuItems.some(item => item.menu === activeTab && (!item.category || item.category === 'Uncategorized')) && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                        <div className="bg-amber-500 text-white p-1 rounded-full mt-0.5">
                            <ArrowRight size={14} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Uncategorized Items Found</p>
                            <p className="text-xs text-amber-700">Some items are not assigned to any category. They will show up under "Uncategorized" in the editor.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest text-center">
                Changes apply instantly to live menu
            </div>
        </div>
    );
};

export default CategoryManager;

import React, { useState, useEffect } from 'react';
import { MenuItem, Category, MenuSettings } from '../src/types';
import { getCategoriesByMenu } from '../constants';
import { generateMenuDescription } from '../services/geminiService';
import { addMenuItem, updateMenuItem, deleteMenuItem, getMenuItems, updateMenuSettings, getMenuSettings } from '../services/firestoreService';
import { uploadImage } from '../services/storageService';
import SearchBar from './SearchBar';
import CategoryManager from './CategoryManager';
import { useToast } from './Toast';
import { X, Plus, Sparkles, Loader2, Image as ImageIcon, DollarSign, Edit3, Trash2, Calendar, CheckCircle, Upload, Settings, ChevronUp, ChevronDown } from 'lucide-react';

interface MenuEditorProps {
    menu: MenuItem[];
    onUpdate: () => void;
    userRole?: string;
    isReadOnly?: boolean;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ menu, onUpdate, userRole, isReadOnly = false }) => {
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string | 'All'>('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [viewSeason, setViewSeason] = useState<'Summer' | 'Winter'>('Summer');
    const [activeSeason, setActiveSeason] = useState<'Summer' | 'Winter'>('Summer');
    const [viewMenu, setViewMenu] = useState<'presto' | 'room-service' | 'seashell'>('room-service');
    const [activeMenu, setActiveMenu] = useState<'presto' | 'room-service' | 'seashell'>('room-service');
    const [settings, setSettings] = useState<MenuSettings | null>(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { showSuccess, showError, showWarning } = useToast();

    // Derived: is this user a super-admin or admin2 (full cross-menu access)?
    const isAdminRole = userRole === 'admin' || userRole === 'admin2';

    // The outlet menu that this non-admin user is locked to (null for admins)
    const lockedMenu: 'presto' | 'room-service' | 'seashell' | null =
        userRole === 'seashell' ? 'seashell' :
        userRole === 'presto' ? 'presto' :
        userRole === 'room-service' ? 'room-service' :
        null;

    // Load active season and menu on mount
    const init = async () => {
        if (menu.length > 0) setHasExistingData(true);
        const fetchedSettings = await getMenuSettings();
        if (fetchedSettings) {
            setSettings(fetchedSettings);
            setActiveSeason(fetchedSettings.activeSeason);
            setActiveMenu(fetchedSettings.activeMenu || 'room-service');
            
            // Admin (both admin and admin2) can switch freely; outlet staff are locked
            if (lockedMenu) {
                setViewMenu(lockedMenu);
            } else {
                setViewMenu(fetchedSettings.activeMenu || 'room-service');
            }
        }
    };

    useEffect(() => {
        init();
    }, [menu, userRole]);

    // Dynamic Categories Helper
    const getCurrentCategories = () => {
        let cats: string[] = [];
        if (settings?.categories?.[viewMenu]) {
            cats = [...settings.categories[viewMenu]!];
        } else {
            cats = [...getCategoriesByMenu(viewMenu)];
        }

        // Add "Uncategorized" if there are items in it
        const hasUncategorized = menu.some(item => item.menu === viewMenu && (!item.category || item.category === 'Uncategorized'));
        if (hasUncategorized && !cats.includes('Uncategorized')) {
            cats.push('Uncategorized');
        }
        return cats;
    };

    const handleEdit = (item: MenuItem) => {
        if (isReadOnly) {
            showError("Access Denied. Menu editing is restricted to Admin roles.");
            return;
        }
        setEditingItem({ ...item });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        if (isReadOnly) {
            showError("Access Denied. Menu editing is restricted to Admin roles.");
            return;
        }
        // Get the first category for the current menu view (dynamic)
        const categories = getCurrentCategories();
        const defaultCategory = categories[0] || 'Uncategorized';
        setEditingItem({
            name: '',
            description: '',
            price: 0,
            category: defaultCategory,
            menuType: 'All Day',
            image: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
            isAvailable: true,
            season: viewSeason,
            menu: viewMenu // Lock to current view menu
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (isReadOnly) {
            showError("Access Denied. Menu editing is restricted to Admin roles.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteMenuItem(id);
                onUpdate();
                showSuccess('Item deleted successfully');
            } catch (error) {
                console.error("Error deleting item:", error);
                showError('Failed to delete item');
            }
        }
    };

    const handleSaveModal = async () => {
        if (!editingItem || !editingItem.name || editingItem.price === undefined || editingItem.price === null || isNaN(Number(editingItem.price))) {
            showError("Unable to save item. Please ensure the price is a valid number and all required fields are filled.");
            return;
        }

        try {
            // 1. Strip the document ID — Firestore rejects id inside the update payload
            const { id, ...cleanData } = editingItem;

            // 2. Round all price fields to 3 decimal places (KWD standard)
            const roundKWD = (v: number | undefined) =>
                v !== undefined ? Math.round(Number(v) * 1000) / 1000 : undefined;

            // Validate bundles
            if (cleanData.bundlePricing && cleanData.bundlePricing.some(b => !b.price || b.price <= 0)) {
                showWarning("Please ensure all bundle pricing tiers have a valid price greater than 0.");
                return;
            }

            // Validate addons
            if (cleanData.addons && cleanData.addons.some(a => !a.name.trim() || isNaN(a.price))) {
                showWarning("Please ensure all addons have a valid name and price.");
                return;
            }

            // Validate sizes
            if (cleanData.sizes && cleanData.sizes.some(s => !s.name.trim() || isNaN(s.price))) {
                showWarning("Please ensure all sizes have a valid name and price.");
                return;
            }

            const rawPayload: any = {
                ...cleanData,
                price: roundKWD(Number(cleanData.price) || 0)!,
                discountPrice: cleanData.discountPrice !== undefined ? roundKWD(cleanData.discountPrice) : null,
                discountLabel: cleanData.discountLabel || null,
                sizes: cleanData.sizes ? cleanData.sizes.map(s => ({ ...s, price: roundKWD(s.price)! })) : [],
                addons: cleanData.addons ? cleanData.addons.map(a => ({ ...a, price: roundKWD(a.price)! })) : [],
                bundlePricing: cleanData.bundlePricing ? cleanData.bundlePricing.map(b => ({ ...b, price: roundKWD(b.price)! })) : [],
                tags: cleanData.tags || [],
                note: cleanData.note || null
            };

            // 3. Remove undefined values, but keep null and empty arrays!
            const itemToSave = Object.fromEntries(
                Object.entries(rawPayload).filter(([, v]) => v !== undefined)
            ) as Partial<MenuItem>;

            if (id) {
                await updateMenuItem(id, itemToSave);
            } else {
                await addMenuItem(itemToSave as MenuItem);
            }

            onUpdate();
            setIsModalOpen(false);
            setEditingItem(null);
            showSuccess('Item saved successfully');
        } catch (error) {
            console.error("Error saving menu item:", error);
            showError("Failed to save item. Please try again.");
        }
    };

    const handleGenerateAI = async () => {
        if (!editingItem?.name) {
            showWarning("Please enter a dish name first.");
            return;
        }
        setIsGenerating(true);
        const dishName = typeof editingItem.name === 'object' ? editingItem.name.en : editingItem.name;
        const dishDescription = typeof editingItem.description === 'object' ? editingItem.description.en : editingItem.description;
        const context = dishDescription || "Fresh ingredients";
        const result = await generateMenuDescription(dishName, context);

        if (result) {
            setEditingItem(prev => ({
                ...prev,
                description: result.description
            }));
            showSuccess("Description generated successfully!");
        } else {
            showError("Could not generate content. Check API key or try again.");
        }
        setIsGenerating(false);
    };

    const handleMoveItem = async (item: MenuItem, direction: 'up' | 'down') => {
        if (isReadOnly) {
            showError("Access Denied. Menu editing is restricted to Admin roles.");
            return;
        }
        
        // Find current index in the FILTERED list (since we move relative to what we see)
        const currentIndex = filteredMenu.findIndex(i => i.id === item.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (targetIndex < 0 || targetIndex >= filteredMenu.length) return;
        
        const targetItem = filteredMenu[targetIndex];
        
        // Swap their sort orders
        // Use timestamps as fallback for new items without sortOrder
        const currentOrder = item.sortOrder ?? (item.createdAt as any)?.seconds ?? Date.now();
        const targetOrder = targetItem.sortOrder ?? (targetItem.createdAt as any)?.seconds ?? Date.now() - 1;

        if (item.id && targetItem.id) {
            try {
                await updateMenuItem(item.id, { sortOrder: targetOrder });
                await updateMenuItem(targetItem.id, { sortOrder: currentOrder });
                onUpdate();
            } catch (error) {
                console.error("Error moving item:", error);
                showError("Failed to move item.");
            }
        }
    };

    const handlePublishSeason = async () => {
        try {
            const newSeason = activeSeason === 'Summer' ? 'Winter' : 'Summer';
            await updateMenuSettings({ activeSeason: newSeason });
            setActiveSeason(newSeason);
            showSuccess(`${newSeason} menu published`);
        } catch (error) {
            console.error("Error publishing season:", error);
            showError("Failed to publish season.");
        }
    };

    const filteredMenu = menu.filter(item => {
        // Filter by category
        const itemCategory = item.category || 'Uncategorized';
        const categoryMatch = filterCategory === 'All' || itemCategory === filterCategory;

        // Filter by season
        const seasonMatch = item.season === viewSeason || (!item.season && viewSeason === 'Summer');

        // Filter by menu
        const menuMatch = item.menu === viewMenu || (!item.menu && viewMenu === 'room-service');

        // Filter by search query
        let searchMatch = true;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const name = typeof item.name === 'object' ? item.name.en : item.name;
            const description = typeof item.description === 'object' ? item.description.en : item.description;
            const category = item.category || 'Uncategorized';

            searchMatch = (
                name.toLowerCase().includes(query) ||
                description?.toLowerCase().includes(query) ||
                category.toLowerCase().includes(query)
            );
        }

        return categoryMatch && seasonMatch && menuMatch && searchMatch;
    }).sort((a, b) => {
        // 1. Availability first (available items on top)
        if (a.isAvailable !== b.isAvailable) {
            return a.isAvailable ? -1 : 1;
        }
        // 2. Then by manual sortOrder
        const orderA = a.sortOrder ?? 999999;
        const orderB = b.sortOrder ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        
        // 3. Fallback to creation date
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
    });

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 md:p-8 overflow-x-hidden">
            {/* Header - Responsive */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink truncate">
                            {userRole === 'admin' ? 'Menu Curation' : 
                             userRole === 'seashell' ? 'Seashell Menu' : 
                             userRole === 'presto' ? 'Presto Menu' : 'Room Service Menu'}
                        </h2>
                        <p className="text-slate-500 font-serif italic mt-1 text-sm sm:text-base">
                            {isReadOnly ? 'Explore the culinary collection' : 'Design the guest dining experience'}
                        </p>
                    </div>

                    {/* Add New Button - Admin Only */}
                    {!isReadOnly && (
                        <div className="flex gap-2 flex-shrink-0">
                            {userRole === 'admin' && (
                                <button
                                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                                    className={`px-4 py-2 sm:px-6 sm:py-3 transition-colors font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center shadow-lg rounded ${showCategoryManager ? 'bg-gold text-white' : 'bg-white text-ink border border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <Settings size={14} className="mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Category Settings</span>
                                    <span className="sm:hidden">Cats</span>
                                </button>
                            )}
                            <button
                                onClick={handleAddNew}
                                className="bg-ink text-white hover:bg-gold hover:text-ink px-4 py-2 sm:px-6 sm:py-3 transition-colors font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center shadow-lg rounded"
                            >
                                <Plus size={14} className="mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Add New Dish</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Category Manager (Conditional) */}
                {showCategoryManager && settings && !isReadOnly && (
                    <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                        <CategoryManager 
                            settings={settings} 
                            menuItems={menu} 
                            onUpdate={onUpdate} 
                        />
                    </div>
                )}

                {/* Controls Row - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Menu Switcher - Admin Only */}
                    {userRole === 'admin' ? (
                        <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-between">
                            <div className="flex flex-1">
                                <button
                                    onClick={() => {
                                        setViewMenu('presto');
                                        setFilterCategory('All');
                                    }}
                                    className={`flex-1 px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewMenu === 'presto' ? 'bg-gold text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Presto
                                </button>
                                <button
                                    onClick={() => {
                                        setViewMenu('room-service');
                                        setFilterCategory('All');
                                    }}
                                    className={`flex-1 px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewMenu === 'room-service' ? 'bg-purple-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    RoomSVC
                                </button>
                                <button
                                    onClick={() => {
                                        setViewMenu('seashell');
                                        setFilterCategory('All');
                                    }}
                                    className={`flex-1 px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewMenu === 'seashell' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Seashell
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-center">
                             <span className="text-[10px] sm:text-xs font-bold text-gold uppercase tracking-widest">
                                Department: {viewMenu === 'room-service' ? 'RoomSVC' : viewMenu.charAt(0).toUpperCase() + viewMenu.slice(1)}
                             </span>
                        </div>
                    )}

                    {/* Season Switcher */}
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-between">
                        <div className="flex flex-1">
                            <button
                                onClick={() => setViewSeason('Summer')}
                                className={`flex-1 px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewSeason === 'Summer' ? 'bg-gold text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Summer
                            </button>
                            <button
                                onClick={() => setViewSeason('Winter')}
                                className={`flex-1 px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewSeason === 'Winter' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Winter
                            </button>
                        </div>
                        {userRole === 'admin' && activeSeason !== viewSeason && (
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Make ${viewSeason} menu live?`)) {
                                        try {
                                            await updateMenuSettings({ activeSeason: viewSeason });
                                            setActiveSeason(viewSeason);
                                            showSuccess(`${viewSeason} menu published`);
                                        } catch (error) {
                                            console.error("Error updating season:", error);
                                            showError("Failed to make season live");
                                        }
                                    }
                                }}
                                className="ml-1 px-2 py-1.5 bg-green-500 text-white text-[10px] font-bold uppercase rounded hover:bg-green-600"
                            >
                                <CheckCircle size={12} />
                            </button>
                        )}
                    </div>

                    {/* Live Indicator Note */}
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">All {activeSeason} Menus Are Live</span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase ${activeSeason === 'Summer' ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-500'}`}>
                            {activeSeason === 'Summer' ? <Sparkles size={12} /> : <Calendar size={12} />}
                            {activeSeason}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search menu..."
                        />
                    </div>
                </div>
            </div>

            {/* Categories - Horizontal scroll with mouse drag support */}
            <div 
                className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 border-b-2 border-slate-200 flex-shrink-0 cursor-grab active:cursor-grabbing select-none scroll-smooth"
                onMouseDown={(e) => {
                    const el = e.currentTarget;
                    const startX = e.pageX - el.offsetLeft;
                    const scrollLeft = el.scrollLeft;
                    
                    const onMouseMove = (moveEvent: MouseEvent) => {
                        const x = moveEvent.pageX - el.offsetLeft;
                        const walk = (x - startX) * 2; // Scroll speed
                        el.scrollLeft = scrollLeft - walk;
                    };
                    
                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                    };
                    
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d4af37 transparent'
                }}
            >
                <style dangerouslySetInnerHTML={{ __html: `
                    .scrollbar-visible::-webkit-scrollbar {
                        height: 4px;
                    }
                    .scrollbar-visible::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .scrollbar-visible::-webkit-scrollbar-thumb {
                        background-color: #d4af37;
                        border-radius: 20px;
                    }
                `}} />
                <button
                    onClick={() => setFilterCategory('All')}
                    className={`px-3 sm:px-6 py-2 font-serif text-xs sm:text-sm transition-all whitespace-nowrap border rounded-lg flex-shrink-0 ${filterCategory === 'All' ? 'bg-ink text-white border-ink' : 'text-slate-700 hover:text-ink hover:bg-slate-100 border-slate-300 bg-white'}`}
                >
                    All
                </button>
                {getCurrentCategories().map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 sm:px-6 py-2 font-serif text-xs sm:text-sm transition-all whitespace-nowrap border rounded-lg flex-shrink-0 ${filterCategory === cat ? 'bg-ink text-white border-ink' : 'text-slate-700 hover:text-ink hover:bg-slate-100 border-slate-300 bg-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid - Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pb-20">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="bg-white p-4 group hover:shadow-xl transition-all duration-500 border border-slate-100 relative flex flex-col">
                            <div className="h-48 overflow-hidden mb-4 relative">
                                <img
                                    src={item.images?.[0] || item.image || item.imageUrl || `https://source.unsplash.com/featured/?food,${item.category}`}
                                    alt={typeof item.name === 'object' ? item.name.en : item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 border-4 border-white/20 pointer-events-none"></div>

                                {/* Hover Overlay Controls */}
                                <div className="absolute inset-0 bg-black/5 transition-all duration-300 opacity-0 group-hover:opacity-100 flex justify-between items-start p-3 z-10">
                                    <span className="bg-white/95 backdrop-blur text-ink text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-sm border border-slate-100 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                        {item.category}
                                    </span>
                                    
                                    {/* Sort Controls (Only visible when filtering by category) */}
                                    {!isReadOnly && filterCategory !== 'All' && (
                                        <div className="flex flex-col gap-1 absolute right-12 top-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveItem(item, 'up'); }}
                                                className="bg-white text-ink p-1 rounded-full hover:bg-gold hover:text-white shadow-md"
                                                title="Move Up"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveItem(item, 'down'); }}
                                                className="bg-white text-ink p-1 rounded-full hover:bg-gold hover:text-white shadow-md"
                                                title="Move Down"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {!isReadOnly && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                            className="bg-white text-ink p-2 rounded-full hover:bg-gold hover:text-white transition-colors shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                                            title="Edit Dish"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    )}
                                    {isReadOnly && (
                                        <div className="bg-white text-ink p-2 rounded-full shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>

                                {!item.isAvailable && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none z-20">
                                        <span className="font-bold text-ink uppercase tracking-wider border-2 border-ink px-3 py-1">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif font-bold text-lg text-ink leading-tight group-hover:text-gold transition-colors">
                                        {typeof item.name === 'object' ? item.name.en : item.name}
                                    </h3>
                                    <div className="flex flex-col items-end ml-2">
                                        {/* Show discount pricing */}
                                        {item.discountPrice != null && item.discountPrice > 0 && item.discountPrice < item.price ? (
                                            <>
                                                <span className="font-sans text-xs text-slate-400 line-through">{item.price.toFixed(3)}</span>
                                                <span className="font-serif font-bold text-red-600">{item.discountPrice.toFixed(3)} KD</span>
                                            </>
                                        ) : (
                                            <span className="font-serif font-bold text-ink">{item.price.toFixed(3)} KD</span>
                                        )}
                                    </div>
                                </div>

                                {/* Discount & Bundle Badges */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {item.discountPrice != null && item.discountPrice > 0 && item.discountPrice < item.price && (
                                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            🏷️ {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                                        </span>
                                    )}
                                    {item.discountLabel && (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                            {item.discountLabel}
                                        </span>
                                    )}
                                    {item.bundlePricing && item.bundlePricing.length > 0 && (
                                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            📦 {item.bundlePricing.length} Bundle{item.bundlePricing.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                <p className="text-slate-500 text-sm line-clamp-3 font-light leading-relaxed">
                                    {typeof item.description === 'object' ? item.description.en : item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {
                isModalOpen && editingItem && (
                    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                        <div className="bg-paper w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t-4 sm:border-t-8 border-gold animate-in fade-in zoom-in-95 duration-300 flex flex-col my-2 sm:my-0">
                            <div className="p-4 sm:p-6 md:p-8 border-b border-slate-200 flex justify-between items-start sticky top-0 bg-paper z-10">
                                <div className="min-w-0 flex-1 mr-4">
                                    <h3 className="text-lg sm:text-2xl font-serif font-bold text-ink truncate">{editingItem.id?.length! > 5 ? 'Edit Masterpiece' : 'New Creation'}</h3>
                                    <p className="text-slate-500 italic font-serif text-xs sm:text-sm">Refine the culinary details</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-ink transition-colors flex-shrink-0 p-1"><X size={20} /></button>
                            </div>

                            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                                {/* High contrast input group */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Dish Name</label>
                                    <input
                                        type="text"
                                        value={typeof editingItem.name === 'object' ? (editingItem.name as any).en : editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                        className="w-full p-3 border-2 border-slate-300 text-ink font-serif text-lg placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white transition-colors shadow-sm"
                                        placeholder="e.g. Truffle Risotto"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                                            Category
                                            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded ${editingItem.menu === 'presto' ? 'bg-gold/20 text-gold' : editingItem.menu === 'seashell' ? 'bg-blue-500/20 text-blue-600' : 'bg-purple-500/20 text-purple-600'}`}>
                                                {editingItem.menu === 'presto' ? 'Presto' : editingItem.menu === 'seashell' ? 'Seashell' : 'RoomSVC'}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={editingItem.category}
                                                onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                                className="w-full p-3 border-2 border-slate-300 text-ink font-sans bg-white focus:border-gold focus:ring-0 outline-none appearance-none cursor-pointer shadow-sm"
                                            >
                                                {getCurrentCategories().map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Price (KWD)</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-3 top-4 text-slate-400" />
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                value={editingItem.price ?? ''}
                                                onChange={e => {
                                                    const raw = parseFloat(e.target.value);
                                                    setEditingItem({ ...editingItem, price: isNaN(raw) ? 0 : raw });
                                                }}
                                                className="w-full pl-8 p-3 border-2 border-slate-300 text-ink font-serif font-bold text-lg bg-white focus:border-gold focus:ring-0 outline-none shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Season, Menu & Note */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Season</label>
                                        <div className="flex gap-2 sm:gap-4 p-2 sm:p-3 border-2 border-slate-300 bg-white">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="season"
                                                    value="Summer"
                                                    checked={editingItem.season === 'Summer'}
                                                    onChange={() => setEditingItem({ ...editingItem, season: 'Summer' })}
                                                    className="text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm font-serif">Summer</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="season"
                                                    value="Winter"
                                                    checked={editingItem.season === 'Winter'}
                                                    onChange={() => setEditingItem({ ...editingItem, season: 'Winter' })}
                                                    className="text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm font-serif">Winter</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Menu</label>
                                        {isAdminRole ? (
                                            // Admins can re-assign an item to any menu
                                            <div className={`flex flex-wrap gap-2 sm:gap-4 p-2 sm:p-3 border-2 bg-white ${editingItem.menu === 'presto' ? 'border-gold' : editingItem.menu === 'seashell' ? 'border-blue-500' : 'border-purple-500'}`}>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="menu"
                                                        value="presto"
                                                        checked={editingItem.menu === 'presto'}
                                                        onChange={() => {
                                                            const prestoCats = settings?.categories?.['presto'] || getCategoriesByMenu('presto');
                                                            const newCategory = prestoCats[0] || 'Uncategorized';
                                                            setEditingItem({ ...editingItem, menu: 'presto', category: newCategory });
                                                        }}
                                                        className="text-gold focus:ring-gold"
                                                    />
                                                    <span className={`text-sm font-serif ${editingItem.menu === 'presto' ? 'font-bold text-gold' : ''}`}>Presto</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="menu"
                                                        value="room-service"
                                                        checked={editingItem.menu === 'room-service'}
                                                        onChange={() => {
                                                            const rsCats = settings?.categories?.['room-service'] || getCategoriesByMenu('room-service');
                                                            const newCategory = rsCats[0] || 'Uncategorized';
                                                            setEditingItem({ ...editingItem, menu: 'room-service', category: newCategory });
                                                        }}
                                                        className="text-purple-500 focus:ring-purple-500"
                                                    />
                                                    <span className={`text-sm font-serif ${editingItem.menu === 'room-service' ? 'font-bold text-purple-600' : ''}`}>RoomSVC</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="menu"
                                                        value="seashell"
                                                        checked={editingItem.menu === 'seashell'}
                                                        onChange={() => {
                                                            const shellCats = settings?.categories?.['seashell'] || getCategoriesByMenu('seashell');
                                                            const newCategory = shellCats[0] || 'Uncategorized';
                                                            setEditingItem({ ...editingItem, menu: 'seashell', category: newCategory });
                                                        }}
                                                        className="text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span className={`text-sm font-serif ${editingItem.menu === 'seashell' ? 'font-bold text-blue-600' : ''}`}>Seashell</span>
                                                </label>
                                            </div>
                                        ) : (
                                            // Outlet staff: locked badge — cannot re-assign items to another menu
                                            <div className="flex items-center gap-2 p-3 border-2 border-slate-200 bg-slate-50">
                                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                                                    editingItem.menu === 'presto' ? 'bg-gold/10 text-gold border border-gold/30' :
                                                    editingItem.menu === 'seashell' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                                }`}>
                                                    {editingItem.menu === 'room-service' ? 'Room Service' : editingItem.menu === 'seashell' ? 'Seashell' : 'Presto'}
                                                </span>
                                                <span className="text-xs text-slate-400">Items are locked to your outlet</span>
                                            </div>
                                        )}

                                        {isAdminRole && editingItem.menu !== viewMenu && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                ⚠️ Warning: This item is in a different menu than currently viewing.
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Note</label>
                                        <input
                                            type="text"
                                            value={editingItem.note || ''}
                                            onChange={e => setEditingItem({ ...editingItem, note: e.target.value })}
                                            className="w-full p-3 border-2 border-slate-300 text-ink font-sans text-sm placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white shadow-sm"
                                            placeholder="e.g. Served with cream"
                                        />
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Sizes</label>
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, sizes: [...(editingItem.sizes || []), { name: '', price: 0 }] })}
                                            className="text-xs text-gold font-bold uppercase tracking-wider flex items-center hover:text-amber-600"
                                        >
                                            <Plus size={12} className="mr-1" /> Add Size
                                        </button>
                                    </div>
                                    {editingItem.sizes?.map((size, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Size Name"
                                                value={size.name}
                                                onChange={e => {
                                                    const newSizes = [...editingItem.sizes!];
                                                    newSizes[index].name = e.target.value;
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="flex-1 p-2 border border-slate-300 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={size.price}
                                                onChange={e => {
                                                    const newSizes = [...editingItem.sizes!];
                                                    newSizes[index].price = parseFloat(e.target.value);
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="w-24 p-2 border border-slate-300 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newSizes = editingItem.sizes!.filter((_, i) => i !== index);
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingItem.sizes || editingItem.sizes.length === 0) && <p className="text-xs text-slate-400 italic">No specific sizes defined.</p>}
                                </div>

                                {/* Addons */}
                                <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Addons</label>
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, addons: [...(editingItem.addons || []), { name: '', price: 0 }] })}
                                            className="text-xs text-gold font-bold uppercase tracking-wider flex items-center hover:text-amber-600"
                                        >
                                            <Plus size={12} className="mr-1" /> Add Addon
                                        </button>
                                    </div>
                                    {editingItem.addons?.map((addon, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Addon Name"
                                                value={addon.name}
                                                onChange={e => {
                                                    const newAddons = [...editingItem.addons!];
                                                    newAddons[index].name = e.target.value;
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="flex-1 p-2 border border-slate-300 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={addon.price}
                                                onChange={e => {
                                                    const newAddons = [...editingItem.addons!];
                                                    newAddons[index].price = parseFloat(e.target.value);
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="w-24 p-2 border border-slate-300 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newAddons = editingItem.addons!.filter((_, i) => i !== index);
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingItem.addons || editingItem.addons.length === 0) && <p className="text-xs text-slate-400 italic">No addons defined.</p>}
                                </div>

                                {/* === DISCOUNT SECTION === */}
                                <div className="space-y-4 bg-red-50 p-4 border border-red-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                                            🏷️ Item Discount
                                        </label>
                                        <button
                                            onClick={() => {
                                                if (editingItem.discountPrice) {
                                                    // Clear discount
                                                    setEditingItem({ ...editingItem, discountPrice: undefined, discountLabel: undefined });
                                                } else {
                                                    // Enable discount with 10% off default
                                                    const discounted = Math.round((editingItem.price || 0) * 0.9 * 1000) / 1000;
                                                    setEditingItem({ ...editingItem, discountPrice: discounted, discountLabel: 'Special Offer!' });
                                                }
                                            }}
                                            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded ${editingItem.discountPrice
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                                                }`}
                                        >
                                            {editingItem.discountPrice ? '✓ Discount Active' : 'Add Discount'}
                                        </button>
                                    </div>

                                    {editingItem.discountPrice !== undefined && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-red-600 mb-1">Original Price</label>
                                                    <div className="p-2 bg-white border border-red-200 text-slate-500 line-through text-sm">
                                                        {(editingItem.price || 0).toFixed(3)} KD
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-red-600 mb-1">Discounted Price *</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={editingItem.discountPrice || ''}
                                                        onChange={e => setEditingItem({ ...editingItem, discountPrice: parseFloat(e.target.value) || 0 })}
                                                        className="w-full p-2 border-2 border-red-400 text-sm bg-white font-bold text-red-700"
                                                        placeholder="New Price"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-red-600 mb-1">Discount Label (shown to guests)</label>
                                                <input
                                                    type="text"
                                                    value={editingItem.discountLabel || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, discountLabel: e.target.value })}
                                                    className="w-full p-2 border border-red-300 text-sm bg-white"
                                                    placeholder="e.g., Winter Special!, Happy Hour, 20% OFF"
                                                />
                                            </div>
                                            {editingItem.discountPrice && editingItem.price && editingItem.discountPrice < editingItem.price && (
                                                <div className="text-xs text-red-600 font-medium">
                                                    💰 Savings: {Math.round(((editingItem.price - editingItem.discountPrice) / editingItem.price) * 100)}% off
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* === BUNDLE PRICING SECTION === */}
                                <div className="space-y-2 bg-purple-50 p-4 border border-purple-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                                            📦 Bundle Pricing
                                        </label>
                                        <button
                                            onClick={() => setEditingItem({
                                                ...editingItem,
                                                bundlePricing: [...(editingItem.bundlePricing || []), { quantity: 2, price: 0, label: '' }]
                                            })}
                                            className="text-xs text-purple-700 font-bold uppercase tracking-wider flex items-center hover:text-purple-900 bg-purple-100 px-2 py-1 rounded border border-purple-300"
                                        >
                                            <Plus size={12} className="mr-1" /> Add Bundle Tier
                                        </button>
                                    </div>
                                    <p className="text-xs text-purple-600 italic">e.g., "3 pizzas for 8.750 KD" instead of individual pricing</p>

                                    {editingItem.bundlePricing?.map((bundle, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-white p-2 rounded border border-purple-200">
                                            <span className="text-xs text-purple-600 font-medium">Buy</span>
                                            <input
                                                type="number"
                                                min="2"
                                                value={bundle.quantity}
                                                onChange={e => {
                                                    const newBundles = [...editingItem.bundlePricing!];
                                                    newBundles[index].quantity = parseInt(e.target.value) || 2;
                                                    setEditingItem({ ...editingItem, bundlePricing: newBundles });
                                                }}
                                                className="w-16 p-2 border border-purple-300 text-sm text-center"
                                            />
                                            <span className="text-xs text-purple-600 font-medium">for</span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={bundle.price}
                                                onChange={e => {
                                                    const newBundles = [...editingItem.bundlePricing!];
                                                    newBundles[index].price = parseFloat(e.target.value) || 0;
                                                    setEditingItem({ ...editingItem, bundlePricing: newBundles });
                                                }}
                                                className="w-24 p-2 border border-purple-300 text-sm"
                                                placeholder="Price"
                                            />
                                            <span className="text-xs text-purple-600 font-medium">KD</span>
                                            <input
                                                type="text"
                                                value={bundle.label || ''}
                                                onChange={e => {
                                                    const newBundles = [...editingItem.bundlePricing!];
                                                    newBundles[index].label = e.target.value;
                                                    setEditingItem({ ...editingItem, bundlePricing: newBundles });
                                                }}
                                                className="flex-1 p-2 border border-purple-300 text-sm"
                                                placeholder="Label (optional)"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newBundles = editingItem.bundlePricing!.filter((_, i) => i !== index);
                                                    setEditingItem({ ...editingItem, bundlePricing: newBundles.length > 0 ? newBundles : undefined });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingItem.bundlePricing || editingItem.bundlePricing.length === 0) && (
                                        <p className="text-xs text-purple-400 italic">No bundle deals defined.</p>
                                    )}
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
                                        value={typeof editingItem.description === 'object' ? editingItem.description.en : editingItem.description}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        rows={4}
                                        className="w-full p-3 border-2 border-slate-300 text-ink font-sans leading-relaxed placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white shadow-sm resize-none"
                                        placeholder="Describe the dish ingredients..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Images (Max 5)</label>

                                    {/* Image Preview Grid */}
                                    <div className="grid grid-cols-5 gap-2 mb-2">
                                        {editingItem.images?.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square border border-slate-200 rounded overflow-hidden group">
                                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        const newImages = editingItem.images!.filter((_, i) => i !== idx);
                                                        setEditingItem({ ...editingItem, images: newImages });
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Fallback for legacy single image */}
                                        {!editingItem.images && editingItem.image && (
                                            <div className="relative aspect-square border border-slate-200 rounded overflow-hidden group">
                                                <img src={editingItem.image} alt="Legacy Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setEditingItem({ ...editingItem, image: '' })}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <label className={`flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 p-4 rounded cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors ${((editingItem.images?.length || 0) >= 5) ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                multiple
                                                className="hidden"
                                                onChange={async (e) => {
                                                    if (e.target.files) {
                                                        const files: File[] = Array.from(e.target.files);
                                                        
                                                        // --- SECURITY VALIDATION ---
                                                        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
                                                        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

                                                        const validFiles = files.filter(file => {
                                                            if (!ALLOWED_TYPES.includes(file.type)) {
                                                                alert(`File "${file.name}" is not a supported image type (JPEG, PNG, WebP only).`);
                                                                return false;
                                                            }
                                                            if (file.size > MAX_SIZE) {
                                                                alert(`File "${file.name}" is too large (Max 5MB).`);
                                                                return false;
                                                            }
                                                            return true;
                                                        });

                                                        if (validFiles.length === 0) return;

                                                        setIsUploading(true);

                                                        try {
                                                            const remainingSlots = 5 - (editingItem.images?.length || 0);
                                                            const filesToUpload = validFiles.slice(0, remainingSlots);

                                                            const uploadedUrls: string[] = [];
                                                            for (const file of filesToUpload) {
                                                                try {
                                                                    const path = `menu_items/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                                                                    
                                                                    // Add a 15-second timeout so it doesn't hang forever if Firebase Storage isn't setup
                                                                    const url = await Promise.race([
                                                                        uploadImage(file, path),
                                                                        new Promise<string>((_, reject) => 
                                                                            setTimeout(() => reject(new Error("Upload timed out. Ensure Firebase Storage is enabled in the Firebase Console.")), 15000)
                                                                        )
                                                                    ]);
                                                                    
                                                                    uploadedUrls.push(url);
                                                                } catch (err: any) {
                                                                    console.error("Upload failed", err);
                                                                    alert(`Failed to upload "${file.name}": ${err.message || 'Unknown error'}`);
                                                                }
                                                            }

                                                            setEditingItem(prev => ({
                                                                ...prev!,
                                                                images: [...(prev!.images || []), ...uploadedUrls]
                                                            }));
                                                        } finally {
                                                            setIsUploading(false);
                                                            e.target.value = ''; // Reset input so same file can be selected again
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center text-slate-400">
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={24} className="mb-1 animate-spin text-gold" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gold">Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={24} className="mb-1" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Upload Images</span>
                                                    </>
                                                )}
                                            </div>
                                        </label>

                                        <div className="relative flex-1">
                                            <ImageIcon size={16} className="absolute left-3 top-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Or paste URL..."
                                                value={editingItem.image || ''}
                                                onChange={e => {
                                                    // Legacy support: update 'image' field directly
                                                    setEditingItem({ ...editingItem, image: e.target.value });
                                                    // Also add to images array if not present? No, keep separate for now to avoid confusion
                                                }}
                                                className="w-full pl-8 p-3 border-2 border-slate-300 text-ink bg-white focus:border-gold focus:ring-0 outline-none shadow-sm text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2 p-4 bg-slate-100 border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="isAvailable"
                                        checked={editingItem.isAvailable}
                                        onChange={e => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                                        className="w-5 h-5 text-gold rounded focus:ring-gold border-slate-400 cursor-pointer"
                                    />
                                    <label htmlFor="isAvailable" className="text-sm font-bold text-ink uppercase tracking-wide cursor-pointer">Available for ordering</label>
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
                                        disabled={isUploading}
                                        className="px-8 py-3 bg-ink hover:bg-gold hover:text-ink text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? 'Uploading...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MenuEditor;
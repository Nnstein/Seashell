import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../src/types';
import { getMenuItems } from '../services/firestoreService';
import { updateOrderItems } from '../services/firestoreService';
import { MenuItem } from '../src/types';
import { X, Plus, Minus, Search, AlertTriangle, CheckCircle, Trash2, Loader2 } from 'lucide-react';

interface EditCompletedOrderModalProps {
    order: Order;
    onClose: () => void;
    onSaved: () => void;
}

const getItemDisplayName = (item: OrderItem | MenuItem): string => {
    if (!item.name) return 'Unknown';
    if (typeof item.name === 'object') return (item.name as any).en || 'Unknown';
    return item.name;
};

const EditCompletedOrderModal: React.FC<EditCompletedOrderModalProps> = ({ order, onClose, onSaved }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [editedItems, setEditedItems] = useState<OrderItem[]>([...order.items]);
    const [search, setSearch] = useState('');
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const paidTotal = order.totalAmount;

    const currentTotal = editedItems.reduce((sum, item) => {
        return sum + (item.effectiveTotal ?? item.price * item.quantity);
    }, 0);

    const difference = +(currentTotal - paidTotal).toFixed(3);

    useEffect(() => {
        getMenuItems().then(items => {
            // Filter to the same menu as the order
            const filtered = order.menu
                ? items.filter(m => m.menu === order.menu || !m.menu)
                : items;
            setMenuItems(filtered.filter(m => m.isAvailable !== false));
        });
    }, [order.menu]);

    const filteredMenu = menuItems.filter(m =>
        getItemDisplayName(m).toLowerCase().includes(search.toLowerCase())
    );

    const updateQty = (idx: number, delta: number) => {
        setEditedItems(prev => {
            const next = [...prev];
            const newQty = next[idx].quantity + delta;
            if (newQty <= 0) {
                next.splice(idx, 1);
            } else {
                const basePrice = next[idx].unitPrice ?? next[idx].price;
                next[idx] = {
                    ...next[idx],
                    quantity: newQty,
                    effectiveTotal: +(basePrice * newQty).toFixed(3),
                };
            }
            return next;
        });
    };

    const removeItem = (idx: number) => {
        setEditedItems(prev => prev.filter((_, i) => i !== idx));
    };

    const addMenuItem = (menuItem: MenuItem) => {
        const name = getItemDisplayName(menuItem);
        const existing = editedItems.findIndex(
            e => e.itemId === (menuItem.id ?? '') || getItemDisplayName(e) === name
        );
        if (existing >= 0) {
            updateQty(existing, 1);
        } else {
            setEditedItems(prev => [
                ...prev,
                {
                    itemId: menuItem.id ?? '',
                    name: menuItem.name,
                    quantity: 1,
                    price: menuItem.price,
                    unitPrice: menuItem.price,
                    effectiveTotal: menuItem.price,
                } as OrderItem,
            ]);
        }
    };

    const handleSave = async () => {
        if (Math.abs(difference) > 0.001) {
            setError(`Total must equal the paid amount (${paidTotal.toFixed(3)} KD). Current difference: ${difference > 0 ? '+' : ''}${difference.toFixed(3)} KD.`);
            return;
        }
        if (editedItems.length === 0) {
            setError('Order must have at least one item.');
            return;
        }
        if (!note.trim()) {
            setError('Please add a note explaining the reason for the change.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await updateOrderItems(order.id, editedItems, note.trim());
            onSaved();
            onClose();
        } catch (e) {
            setError('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const isSaveEnabled = Math.abs(difference) <= 0.001 && editedItems.length > 0 && note.trim();

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-2xl">
                    <div>
                        <h2 className="font-serif font-bold text-lg">Edit Completed Order</h2>
                        <p className="text-slate-300 text-xs mt-0.5">
                            #{order.id.slice(0, 8)} · {order.guestName || 'Guest'} · Paid: <span className="font-bold text-amber-300">{paidTotal.toFixed(3)} KD</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0 divide-x divide-slate-100">
                    {/* Left: Current Items */}
                    <div className="flex flex-col w-1/2 min-h-0">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Items</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {editedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-sm group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-ink truncate">{getItemDisplayName(item)}</p>
                                        <p className="text-xs text-slate-400">{(item.unitPrice ?? item.price).toFixed(3)} KD each</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQty(idx, -1)}
                                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold text-ink">{item.quantity}</span>
                                        <button onClick={() => updateQty(idx, 1)}
                                            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <p className="text-sm font-bold text-ink">
                                            {(item.effectiveTotal ?? item.price * item.quantity).toFixed(3)}
                                        </p>
                                    </div>
                                    <button onClick={() => removeItem(idx)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {editedItems.length === 0 && (
                                <div className="text-center text-slate-400 text-sm font-serif italic py-8">
                                    No items — add from the menu
                                </div>
                            )}
                        </div>

                        {/* Total bar */}
                        <div className={`px-5 py-3 border-t flex items-center justify-between text-sm font-bold
                            ${Math.abs(difference) <= 0.001
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            <span>New Total</span>
                            <div className="text-right">
                                <span className="text-base">{currentTotal.toFixed(3)} KD</span>
                                {Math.abs(difference) > 0.001 && (
                                    <span className="ml-2 text-xs">({difference > 0 ? '+' : ''}{difference.toFixed(3)} KD vs paid)</span>
                                )}
                                {Math.abs(difference) <= 0.001 && (
                                    <span className="ml-2 text-xs flex items-center gap-1 inline-flex"><CheckCircle size={12} /> Balanced</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Menu search + add items */}
                    <div className="flex flex-col w-1/2 min-h-0">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Add from Menu</p>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search menu items..."
                                    className="w-full text-sm pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                            {filteredMenu.map((item) => (
                                <button key={item.id}
                                    onClick={() => addMenuItem(item)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-ink truncate group-hover:text-amber-800">
                                            {getItemDisplayName(item)}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{item.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-sm font-bold text-ink">{item.price.toFixed(3)}</span>
                                        <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-400 group-hover:text-white flex items-center justify-center transition-colors">
                                            <Plus size={12} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredMenu.length === 0 && (
                                <p className="text-center text-slate-400 text-sm font-serif italic py-8">
                                    {menuItems.length === 0 ? 'Loading menu...' : 'No items match your search'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-3">
                    {/* Change reason */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                            Reason / Note <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Guest called to swap pizza for pasta (same total)"
                            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs font-medium">
                            <AlertTriangle size={14} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-3 justify-end">
                        <button onClick={onClose}
                            className="px-5 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isSaveEnabled || isSaving}
                            className="px-6 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                            {isSaving && <Loader2 size={14} className="animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCompletedOrderModal;

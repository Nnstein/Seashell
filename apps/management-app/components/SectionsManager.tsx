import React, { useState, useEffect } from 'react';
import { LocationSection } from '../src/types';
import { getSections, addSection, updateSection, deleteSection } from '../services/firestoreService';
import { Plus, Edit2, Trash2, MapPin, Save, X, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';

const SectionsManager: React.FC = () => {
    const [sections, setSections] = useState<LocationSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<LocationSection> | null>(null);
    const [rangeInputText, setRangeInputText] = useState('');
    const { showError, showSuccess } = useToast();

    const fetchSections = async () => {
        setLoading(true);
        let data = await getSections();
        if (data.length === 0) {
            const { seedInitialSections } = await import('../utils/seedSections');
            await seedInitialSections();
            data = await getSections();
        }
        setSections(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleAddNew = () => {
        setCurrentSection({
            name: '',
            prefix: '',
            menu: 'seashell',
            isDefault: false,
            padLength: 0,
            requiresPhone: true,
            ranges: []
        });
        setRangeInputText('');
        setIsEditing(true);
    };

    const handleEdit = (section: LocationSection) => {
        setCurrentSection({ ...section });
        if (section.ranges) {
            setRangeInputText(section.ranges.map(r => `${r.min}-${r.max}`).join(', '));
        } else {
            setRangeInputText('');
        }
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this section? Guests using this section's codes will no longer be able to log in.")) return;
        try {
            await deleteSection(id);
            showSuccess('Section deleted successfully');
            fetchSections();
        } catch (error) {
            showError('Failed to delete section');
        }
    };

    const parseRanges = (text: string) => {
        if (!text.trim()) return [];
        const parts = text.split(',');
        const ranges: { min: number, max: number }[] = [];
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [min, max] = trimmed.split('-');
                ranges.push({ min: parseInt(min), max: parseInt(max) });
            } else {
                ranges.push({ min: parseInt(trimmed), max: parseInt(trimmed) });
            }
        }
        return ranges;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSection || !currentSection.name || !currentSection.menu) {
            showError('Please fill out all required fields');
            return;
        }

        try {
            const ranges = parseRanges(rangeInputText);
            const sectionData: Omit<LocationSection, 'id'> = {
                name: currentSection.name,
                prefix: currentSection.prefix || '',
                menu: currentSection.menu as 'seashell' | 'room-service' | 'presto',
                isDefault: currentSection.isDefault || false,
                padLength: currentSection.padLength || 0,
                requiresPhone: currentSection.requiresPhone !== undefined ? currentSection.requiresPhone : true,
                ranges: ranges.length > 0 ? ranges : undefined
            };

            if (currentSection.id) {
                await updateSection(currentSection.id, sectionData);
                showSuccess('Section updated');
            } else {
                await addSection(sectionData);
                showSuccess('Section added');
            }
            setIsEditing(false);
            setCurrentSection(null);
            fetchSections();
        } catch (error) {
            showError('Error saving section');
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading sections...</div>;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink flex items-center">
                        <MapPin className="mr-3 text-gold" size={32} />
                        Locations & Login Sections
                    </h2>
                    <p className="text-slate-500 font-serif italic mt-1">Manage guest access areas, codes, and menus.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={handleAddNew}
                        className="bg-ink text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors shadow-md font-bold text-sm flex items-center"
                    >
                        <Plus size={18} className="mr-2" /> Add New Section
                    </button>
                )}
            </div>

            {isEditing && currentSection ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
                    <h3 className="text-xl font-bold font-serif mb-6">{currentSection.id ? 'Edit Section' : 'Create New Section'}</h3>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Section Name *</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-gold outline-none"
                                    value={currentSection.name}
                                    onChange={e => setCurrentSection({...currentSection, name: e.target.value})}
                                    placeholder="e.g. Gazebo Beds"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Prefix (Optional)</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-gold outline-none"
                                    value={currentSection.prefix}
                                    onChange={e => setCurrentSection({...currentSection, prefix: e.target.value.toUpperCase()})}
                                    placeholder="e.g. GB"
                                />
                                <p className="text-xs text-slate-500 mt-1">Leave empty for purely numeric inputs (like Rooms).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Target Menu *</label>
                                <select 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-gold outline-none bg-white"
                                    value={currentSection.menu}
                                    onChange={e => setCurrentSection({...currentSection, menu: e.target.value as any})}
                                >
                                    <option value="seashell">Seashell (Beach)</option>
                                    <option value="room-service">Room Service</option>
                                    <option value="presto">Presto</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Number Padding Length</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-gold outline-none"
                                    value={currentSection.padLength}
                                    onChange={e => setCurrentSection({...currentSection, padLength: parseInt(e.target.value) || 0})}
                                    placeholder="e.g. 3 for SB001"
                                />
                                <p className="text-xs text-slate-500 mt-1">Use 0 for no padding. Use 3 to make 'GB5' become 'GB005'.</p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Allowed Ranges</label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-gold outline-none"
                                    value={rangeInputText}
                                    onChange={e => setRangeInputText(e.target.value)}
                                    placeholder="e.g. 1-20, 30-40"
                                />
                                <p className="text-xs text-slate-500 mt-1">Comma separated list of valid numbers or ranges (min-max). E.g. "1-45" or "101-112, 114-145".</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={currentSection.isDefault}
                                    onChange={e => setCurrentSection({...currentSection, isDefault: e.target.checked})}
                                    className="w-5 h-5 text-gold rounded border-slate-300 focus:ring-gold"
                                />
                                <div>
                                    <span className="font-bold text-slate-700 block">Set as Default for Location Type</span>
                                    <span className="text-xs text-slate-500">If a guest just types a number without a prefix, it will assume they mean this section.</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={currentSection.requiresPhone}
                                    onChange={e => setCurrentSection({...currentSection, requiresPhone: e.target.checked})}
                                    className="w-5 h-5 text-gold rounded border-slate-300 focus:ring-gold"
                                />
                                <div>
                                    <span className="font-bold text-slate-700 block">Require Phone Number</span>
                                    <span className="text-xs text-slate-500">Prompt the guest to enter their phone number to login.</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button 
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <Save size={18} /> Save Section
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(section => (
                    <div key={section.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleEdit(section)} className="p-2 bg-slate-100 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(section.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner
                                ${section.menu === 'seashell' ? 'bg-blue-100 text-blue-700' : 
                                  section.menu === 'presto' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {section.prefix || '#'}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{section.name}</h3>
                                <p className="text-xs text-slate-400 capitalize">{section.menu.replace('-', ' ')}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-400">Pad Length</span>
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{section.padLength}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-400">Phone Req.</span>
                                <span>{section.requiresPhone ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="font-semibold text-slate-400">Is Default</span>
                                {section.isDefault ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Yes</span> : <span className="text-slate-400">No</span>}
                            </div>
                            <div className="pt-2">
                                <span className="font-semibold text-slate-400 block mb-1">Ranges</span>
                                <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded max-h-24 overflow-y-auto">
                                    {section.ranges && section.ranges.length > 0 ? 
                                        section.ranges.map(r => r.min === r.max ? r.min : `${r.min}-${r.max}`).join(', ') : 
                                        'No limits'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {!isEditing && (
                    <button onClick={handleAddNew} className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl h-full min-h-[250px] text-slate-400 hover:text-gold hover:border-gold hover:bg-orange-50/30 transition-all">
                        <Plus size={32} />
                        <span className="font-bold">Add Section</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default SectionsManager;

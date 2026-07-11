import React, { useState, useEffect } from 'react';
import { User, Key, Save, AlertCircle, CheckCircle2, UserCog, Smartphone, Utensils, Waves, Shield, Mail } from 'lucide-react';
import { manageStaffAccount, getMenuSettings, updateMenuSettings } from '../services/firestoreService';

const StaffManagement: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<'kitchen' | 'seashell' | 'presto' | 'admin' | 'admin2' | 'room-service'>('kitchen');
    const [password, setPassword] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [globalSettings, setGlobalSettings] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '' as 'success' | 'error' | '', text: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getMenuSettings();
        if (settings) {
            setGlobalSettings(settings);
            // Sync custom email field if admin/admin2 selected
            if (selectedRole === 'admin') setCustomEmail(settings.adminEmail || '');
            if (selectedRole === 'admin2') setCustomEmail(settings.admin2Email || '');
        }
    };

    useEffect(() => {
        if (globalSettings) {
            if (selectedRole === 'admin') setCustomEmail(globalSettings.adminEmail || '');
            else if (selectedRole === 'admin2') setCustomEmail(globalSettings.admin2Email || '');
            else setCustomEmail(`${selectedRole}@seashell.internal`);
        }
    }, [selectedRole, globalSettings]);

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password && password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. If it's an admin role and email changed, update Firestore mapping first
            if (selectedRole === 'admin' || selectedRole === 'admin2') {
                const field = selectedRole === 'admin' ? 'adminEmail' : 'admin2Email';
                if (customEmail !== globalSettings?.[field]) {
                    await updateMenuSettings({ [field]: customEmail });
                    await loadSettings();
                }
            }

            // 2. Update the Auth account (Backend)
            // We pass the email to ensure the backend uses the correct target
            await manageStaffAccount(selectedRole, password, customEmail);
            
            setMessage({ 
                type: 'success', 
                text: `Account for ${selectedRole.toUpperCase()} (${customEmail}) has been updated successfully.` 
            });
            setPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update staff account. Ensure you have Admin permissions.' });
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'admin', label: 'Primary Administrator', icon: Shield, desc: 'Master access to all orders and system settings.', color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'admin2', label: 'Secondary Administrator', icon: Shield, desc: 'Shared master access for redundancy.', color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'room-service', label: 'Room Service Staff', icon: Utensils, desc: 'Handles all orders placed from guest rooms (RoomSVC).', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'seashell', label: 'Seashell Staff', icon: Waves, desc: 'Handles all orders placed from sunbeds/beach (Seashell).', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'presto', label: 'Presto Staff', icon: Smartphone, desc: 'Handles all orders placed via Presto QR codes.', color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'kitchen', label: 'Kitchen Display', icon: Utensils, desc: 'View-only queue for back-of-house operations.', color: 'text-slate-600', bg: 'bg-slate-50' },
    ];

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-ink flex items-center gap-3">
                    <UserCog className="text-gold" size={32} />
                    Staff & Security
                </h2>
                <p className="text-slate-500 font-serif italic mt-1">Manage departmental access and admin credentials</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Role Selection */}
                <div className="lg:col-span-1 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Select Account</label>
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id as any)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-start gap-3
                                ${selectedRole === role.id 
                                    ? 'border-gold bg-white shadow-md' 
                                    : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                        >
                            <div className={`p-2 rounded-lg ${role.bg} ${role.color}`}>
                                <role.icon size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-ink text-sm">{role.label}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{role.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right: Security Settings */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <form onSubmit={handleUpdateAccount} className="space-y-6">
                            
                            {/* Email Mapping Section */}
                            <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <h4 className="text-xs font-bold text-slate-600 mb-4 flex items-center gap-2">
                                    <Mail size={14} className="text-gold" />
                                    Account Mapping for "{selectedRole}"
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Attached Email Address</label>
                                        <input 
                                            type="email"
                                            value={customEmail}
                                            onChange={(e) => setCustomEmail(e.target.value)}
                                            disabled={!selectedRole.startsWith('admin')}
                                            className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm transition-all
                                                ${selectedRole.startsWith('admin') 
                                                    ? 'bg-white border-gold/30 focus:border-gold outline-none' 
                                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                                            placeholder="admin@example.com"
                                        />
                                        {selectedRole.startsWith('admin') && (
                                            <p className="text-[10px] text-amber-600 mt-2 italic">
                                                * Changing this will update the email you use to log in as "admin".
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Simple ID (Username)</label>
                                            <div className="px-3 py-2 bg-white/50 border border-slate-100 rounded text-ink font-mono text-sm select-none">
                                                {selectedRole}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
                                            <div className="px-3 py-2 flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Active System Role
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Set New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key size={18} className="text-slate-400 group-focus-within:text-gold transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter at least 6 characters to update"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-ink text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-ink/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Account Changes
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
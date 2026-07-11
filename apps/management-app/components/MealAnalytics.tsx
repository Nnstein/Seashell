import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    TrendingUp, ShoppingBag, Users, BarChart2, Star,
    ChevronDown, CalendarDays, RefreshCw
} from 'lucide-react';
import { fetchAnalytics, AnalyticsData } from '../services/analyticsService';

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = ['#B8973E','#1E293B','#64748B','#94A3B8','#CBD5E1','#F59E0B','#10B981','#EF4444','#8B5CF6','#06B6D4'];
const OUTLET_COLORS: Record<string, string> = { Seashell: '#B8973E', 'Room Service': '#1E293B', Presto: '#64748B' };

const fmt = (n: number) => n.toFixed(3);
const fmtShort = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toFixed(3);

// ─── Date preset helpers ──────────────────────────────────────────────────────
const PRESETS = ['Today','Last 7 Days','Last 30 Days','This Month','This Year'];

const getPreset = (label: string): [Date, Date] => {
    const now = new Date();
    const start = new Date(now);
    switch (label) {
        case 'Today': start.setHours(0,0,0,0); return [start, now];
        case 'Last 7 Days': start.setDate(now.getDate()-7); return [start, now];
        case 'This Month': return [new Date(now.getFullYear(), now.getMonth(), 1), now];
        case 'This Year': return [new Date(now.getFullYear(), 0, 1), now];
        default: start.setDate(now.getDate()-30); return [start, now]; // Last 30 Days
    }
};

const fmtDate = (d: Date) =>
    `${d.getDate().toString().padStart(2,'0')} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()}`;

// ─── Reusable sub-components ─────────────────────────────────────────────────
const KPICard: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; accent: string }> = ({ label, value, sub, icon, accent }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-t-4 ${accent} flex flex-col gap-2 hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            <span className="text-slate-300">{icon}</span>
        </div>
        <p className="text-2xl font-serif font-bold text-ink leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 italic font-serif">{sub}</p>}
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className='' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col ${className}`}>
        <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-ink uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex-1 p-4">{children}</div>
    </div>
);

const Skeleton: React.FC<{ className?: string }> = ({ className='' }) => (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface MealAnalyticsProps { userRole?: string; kitchenContext?: string; }

const MealAnalytics: React.FC<MealAnalyticsProps> = ({ userRole, kitchenContext }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Date range state
    const [preset, setPreset] = useState('Last 30 Days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Menu source filter (passes straight to service)
    const isAdminOrKitchen = userRole === 'admin' || userRole === 'admin2' || (userRole === 'kitchen' && !kitchenContext);
    const lockedMenu: 'all' | 'presto' | 'room-service' | 'seashell' =
        kitchenContext ? (kitchenContext as 'presto' | 'room-service' | 'seashell') :
        userRole === 'seashell' ? 'seashell' :
        userRole === 'presto' ? 'presto' :
        userRole === 'room-service' ? 'room-service' : 'all';
    const [menuSource, setMenuSource] = useState<'all' | 'presto' | 'room-service' | 'seashell'>(lockedMenu);

    // Top meals tab
    const [mealTab, setMealTab] = useState<string>('All');

    // Resolved date range
    const [startDate, endDate] = useMemo<[Date, Date]>(() => {
        if (preset === 'Custom' && customStart && customEnd) return [new Date(customStart), new Date(customEnd)];
        return getPreset(preset);
    }, [preset, customStart, customEnd]);

    const load = async () => {
        setLoading(true);
        setError('');
        setMealTab('All'); // reset tab on filter change
        try {
            const result = await fetchAnalytics(startDate, endDate, menuSource);
            setData(result);
        } catch (e) {
            setError('Failed to load analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch whenever date range or menu source changes
    useEffect(() => { load(); }, [startDate, endDate, menuSource]);

    // Top Meals of the Day — filtered by active tab
    const topMealsFiltered = useMemo(() => {
        if (!data) return [];
        const base = data.topMealsOfDay;
        if (mealTab === 'All') return base.slice(0, 5);
        return base.filter(m => m.category === mealTab).slice(0, 5);
    }, [data, mealTab]);

    // Build tab list: "All" + top 5 real categories
    const mealTabs = useMemo(() => {
        if (!data) return ['All'];
        return ['All', ...data.topCategoriesList];
    }, [data]);

    const selectClass = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-slate-50 focus:bg-white text-ink transition-all";

    return (
        <div className="h-full overflow-y-auto bg-paper">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-serif font-bold text-ink">Meal Analytics</h2>
                        <p className="text-slate-500 font-serif italic text-sm mt-0.5">{fmtDate(startDate)} — {fmtDate(endDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Menu Source (admin/kitchen only) */}
                        {isAdminOrKitchen && (
                            <select value={menuSource} onChange={e => setMenuSource(e.target.value as any)}
                                className={`${selectClass} w-40`}>
                                <option value="all">All Outlets</option>
                                <option value="seashell">Seashell</option>
                                <option value="presto">Presto</option>
                                <option value="room-service">Room Service</option>
                            </select>
                        )}

                        {/* Date picker */}
                        <div className="relative">
                            <button onClick={() => setShowDatePicker(v => !v)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg bg-white hover:border-gold hover:text-gold transition-colors shadow-sm">
                                <CalendarDays size={15} />
                                {preset}
                                <ChevronDown size={14} />
                            </button>

                            {showDatePicker && (
                                <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-64">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Quick Ranges</p>
                                    <div className="space-y-1 mb-3">
                                        {PRESETS.map(p => (
                                            <button key={p} onClick={() => { setPreset(p); setShowDatePicker(false); }}
                                                className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${preset===p ? 'bg-ink text-white font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Custom Range</p>
                                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-gold" />
                                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-gold" />
                                    <button onClick={() => { if (customStart && customEnd) { setPreset('Custom'); setShowDatePicker(false); } }}
                                        disabled={!customStart || !customEnd}
                                        className="w-full py-1.5 text-xs font-bold uppercase tracking-widest bg-ink text-white rounded-lg disabled:opacity-40 hover:bg-gold hover:text-ink transition-colors">
                                        Apply Custom
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={load} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg bg-white hover:border-gold hover:text-gold transition-colors shadow-sm disabled:opacity-50">
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm font-medium">{error}</div>
                )}

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
                    {loading ? Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-28" />) :
                    data ? (<>
                        <KPICard label="Total Revenue" value={`${fmt(data.totalRevenue)} KD`}
                            sub={`${data.totalOrders} completed orders`}
                            icon={<TrendingUp size={20} />} accent="border-gold" />
                        <KPICard label="Total Orders" value={data.totalOrders.toString()}
                            sub="Completed & delivered"
                            icon={<ShoppingBag size={20} />} accent="border-ink" />
                        <KPICard label="Total Customers" value={data.totalCustomers.toString()}
                            sub="Unique guests"
                            icon={<Users size={20} />} accent="border-blue-400" />
                        <KPICard label="Avg Order Value" value={`${fmt(data.avgOrderValue)} KD`}
                            sub="Per completed order"
                            icon={<BarChart2 size={20} />} accent="border-emerald-400" />
                        <KPICard label="Top Category" value={data.topCategory}
                            sub={categoryBreakdownSub(data)}
                            icon={<Star size={20} />} accent="border-purple-400" />
                    </>) : null}
                </div>

                {/* ── Charts Row 1: Revenue + Pie ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <ChartCard title="Revenue Over Time" className="xl:col-span-2 min-h-[260px]">
                        {loading ? <Skeleton className="h-48" /> :
                        data?.revenueOverTime.length ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={data.revenueOverTime} margin={{ top:5, right:10, left:0, bottom:5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize:11, fill:'#94A3B8' }} />
                                    <YAxis tick={{ fontSize:11, fill:'#94A3B8' }} tickFormatter={fmtShort} />
                                    <Tooltip formatter={(v: number) => [`${fmt(v)} KD`, 'Revenue']}
                                        contentStyle={{ borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:12 }} />
                                    <Line type="monotone" dataKey="revenue" stroke="#B8973E" strokeWidth={2.5} dot={false} activeDot={{ r:4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <EmptyState />}
                    </ChartCard>

                    <ChartCard title="Order by Category" className="min-h-[260px]">
                        {loading ? <Skeleton className="h-48" /> :
                        data?.categoryBreakdown.length ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={data.categoryBreakdown.slice(0, 8)}
                                        dataKey="count" nameKey="category"
                                        cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                        paddingAngle={2}
                                    >
                                        {data.categoryBreakdown.slice(0,8).map((_,i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(_: any, __: any, props: any) => [
                                            `${props.payload.pct}% · ${props.payload.count} items · ${fmt(props.payload.revenue)} KD`,
                                            props.payload.category
                                        ]}
                                        contentStyle={{ borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:11 }}
                                    />
                                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize:10 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <EmptyState />}
                    </ChartCard>
                </div>

                {/* ── Charts Row 2: Top Meals + Outlet Distribution ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ChartCard title="Top Selling Meals" className="min-h-[300px]">
                        {loading ? <Skeleton className="h-56" /> :
                        data?.topMeals.length ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={data.topMeals.slice(0,8)} layout="vertical"
                                    margin={{ top:0, right:10, left:0, bottom:0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize:11, fill:'#94A3B8' }} />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize:10, fill:'#475569' }} />
                                    <Tooltip formatter={(v: number) => [v, 'Units Sold']}
                                        contentStyle={{ borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:12 }} />
                                    <Bar dataKey="count" radius={[0,4,4,0]}>
                                        {data.topMeals.slice(0,8).map((_,i) => (
                                            <Cell key={i} fill={i===0?'#B8973E':i===1?'#1E293B':'#94A3B8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState />}
                    </ChartCard>

                    <ChartCard title="Customer Distribution by Outlet" className="min-h-[300px]">
                        {loading ? <Skeleton className="h-56" /> : data ? (<>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.outletDistribution} margin={{ top:10, right:10, left:0, bottom:5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis dataKey="outlet" tick={{ fontSize:12, fill:'#475569' }} />
                                    <YAxis tick={{ fontSize:11, fill:'#94A3B8' }} />
                                    <Tooltip
                                        formatter={(v: number, name: string) => [
                                            name==='orders' ? `${v} orders` : `${fmt(v)} KD`,
                                            name==='orders' ? 'Orders' : 'Revenue'
                                        ]}
                                        contentStyle={{ borderRadius:'8px', border:'1px solid #E2E8F0', fontSize:12 }}
                                    />
                                    <Bar dataKey="orders" name="orders" radius={[4,4,0,0]}>
                                        {data.outletDistribution.map((d,i) => (
                                            <Cell key={i} fill={OUTLET_COLORS[d.outlet] || '#94A3B8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-2 mt-3 border-t border-slate-100 pt-3">
                                {data.outletDistribution.map(o => (
                                    <div key={o.outlet} className="text-center">
                                        <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: OUTLET_COLORS[o.outlet] }} />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{o.outlet}</p>
                                        <p className="text-xs font-bold text-ink">{fmt(o.revenue)} KD</p>
                                    </div>
                                ))}
                            </div>
                        </>) : null}
                    </ChartCard>
                </div>

                {/* ── Top Meals of the Day ── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-ink uppercase tracking-widest">Top Meals of the Day</h3>
                            <p className="text-xs text-slate-400 italic font-serif mt-0.5">Top 5 by units sold in the selected period & outlet</p>
                        </div>
                        {/* Category filter tabs */}
                        <div className="flex flex-wrap p-0.5 bg-slate-100 rounded-lg gap-0.5">
                            {loading ? (
                                <Skeleton className="h-7 w-48" />
                            ) : mealTabs.map(tab => (
                                <button key={tab} onClick={() => setMealTab(tab)}
                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${mealTab===tab ? 'bg-ink text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                            {Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-28" />)}
                        </div>
                    ) : topMealsFiltered.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-serif italic text-sm">
                            No meals found for this category in the selected period.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                            {topMealsFiltered.map((meal, i) => (
                                <div key={i} className="relative border border-slate-100 rounded-xl p-3.5 hover:border-gold/40 hover:shadow-sm transition-all flex flex-col bg-white">
                                    <div className={`absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm ${i===0?'bg-gold':i===1?'bg-slate-600':i===2?'bg-amber-600':'bg-slate-300 text-slate-600'}`}>
                                        {i + 1}
                                    </div>
                                    
                                    {meal.image ? (
                                        <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                                            <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-28 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                                            <ShoppingBag size={28} className="text-slate-200" />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <p className="text-sm font-bold text-ink leading-tight line-clamp-2">{meal.name}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-3 mt-1">
                                        <p className="text-[10px] text-slate-400 font-serif italic">{meal.category}</p>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">{meal.outlet}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-50">
                                        <span className="text-xs font-bold text-gold">{meal.count} sold</span>
                                        <span className="text-xs text-slate-500 font-medium">{fmt(meal.revenue)} KD</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const EmptyState = () => (
    <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-serif italic">
        No data for this period.
    </div>
);

const categoryBreakdownSub = (data: AnalyticsData): string => {
    const top = data.categoryBreakdown[0];
    if (!top) return '';
    return `${top.pct}% of items · ${fmt(top.revenue)} KD`;
};

export default MealAnalytics;

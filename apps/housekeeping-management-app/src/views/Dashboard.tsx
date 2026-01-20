import React, { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, CheckCircle, Bell, BellOff } from 'lucide-react';
import RequestCard from '../components/RequestCard';
import { ServiceRequest } from '../types';
import { useRequestNotifications } from '../hooks/useRequestNotifications';

// Mock Data Generator
const generateMockRequests = (): ServiceRequest[] => [
    {
        id: '1',
        roomNumber: '101',
        status: 'pending',
        createdAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
        type: 'items',
        items: [
            { itemId: 'towel-set', name: { en: 'Towel Set', ar: 'طقم مناشف' }, quantity: 2 },
            { itemId: 'shampoo', name: { en: 'Shampoo', ar: 'شامبو' }, quantity: 1 }
        ]
    },
    {
        id: '2',
        roomNumber: '205',
        status: 'pending',
        createdAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
        type: 'items',
        items: [
            { itemId: 'pillow', name: { en: 'Extra Pillow', ar: 'وسادة إضافية' }, quantity: 1 }
        ]
    },
    {
        id: '3',
        roomNumber: '304',
        status: 'in_progress',
        createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
        type: 'items',
        items: [
            { itemId: 'water', name: { en: 'Water Bottles', ar: 'زجاجات مياه' }, quantity: 4 }
        ]
    }
];

const Dashboard: React.FC = () => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('housekeepingNotificationsEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Enable notification system
    useRequestNotifications(notificationsEnabled);

    useEffect(() => {
        // Load mock data
        setRequests(generateMockRequests());
    }, []);

    const handleComplete = (id: string) => {
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: 'completed' } : req
        ));
        // In real app, would call API here
    };

    const toggleNotifications = () => {
        setNotificationsEnabled((prev: boolean) => {
            const newValue = !prev;
            localStorage.setItem('housekeepingNotificationsEnabled', JSON.stringify(newValue));
            return newValue;
        });
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return req.status !== 'completed'; // Show pending/in_progress by default
        if (filter === 'pending') return req.status === 'pending';
        if (filter === 'completed') return req.status === 'completed';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="text-gold" />
                        <h1 className="text-xl font-bold text-stone-900">Housekeeping Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Notification Toggle */}
                        <button
                            onClick={toggleNotifications}
                            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${notificationsEnabled
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                            title={notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
                        >
                            {notificationsEnabled ? <Bell size={14} className="mr-1.5" /> : <BellOff size={14} className="mr-1.5" />}
                            {notificationsEnabled ? 'ON' : 'OFF'}
                        </button>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live Updates
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">

                {/* Controls */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                        >
                            Completed
                        </button>
                    </div>
                    <button className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900">
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRequests.map(req => (
                        <RequestCard key={req.id} request={req} onComplete={handleComplete} />
                    ))}
                    {filteredRequests.length === 0 && (
                        <div className="col-span-full py-12 text-center text-stone-400">
                            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No requests found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

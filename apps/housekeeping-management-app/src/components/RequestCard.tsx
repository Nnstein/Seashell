import React from 'react';
import { Clock, User, Check } from 'lucide-react';
import { ServiceRequest } from '../types';

interface RequestCardProps {
    request: ServiceRequest;
    onComplete: (id: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onComplete }) => {
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const getName = (name: string | { en: string; ar: string }) => {
        if (typeof name === 'object' && name !== null) {
            return name.en; // Default to English for staff
        }
        return name;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-stone-100 p-2 rounded-lg">
                        <User size={20} className="text-stone-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-stone-900">Room {request.roomNumber}</h3>
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                            <Clock size={12} />
                            <span>{timeAgo(request.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                    {request.status.toUpperCase().replace('_', ' ')}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                {request.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-stone-50 last:border-0 pb-1 last:pb-0">
                        <span className="text-stone-700">{getName(item.name)}</span>
                        <span className="font-bold bg-stone-100 px-2 rounded text-stone-600">x{item.quantity}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onComplete(request.id)}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
                <Check size={18} />
                <span>Mark Complete</span>
            </button>
        </div>
    );
};

export default RequestCard;

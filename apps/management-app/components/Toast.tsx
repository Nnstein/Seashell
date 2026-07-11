import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    details?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number, details?: string) => void;
    showSuccess: (message: string, details?: string) => void;
    showError: (message: string, details?: string) => void;
    showWarning: (message: string, details?: string) => void;
    showInfo: (message: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: PropsWithChildren) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000, details?: string) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const toast: Toast = { id, message, type, duration, details };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const showSuccess = useCallback((message: string, details?: string) => showToast(message, 'success', 4000, details), [showToast]);
    const showError = useCallback((message: string, details?: string) => showToast(message, 'error', 5000, details), [showToast]);
    const showWarning = useCallback((message: string, details?: string) => showToast(message, 'warning', 4000, details), [showToast]);
    const showInfo = useCallback((message: string, details?: string) => showToast(message, 'info', 4000, details), [showToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}

            {/* Toast Container - Top Right */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto
              flex items-start gap-3 p-4 rounded-xl border shadow-lg
              animate-in slide-in-from-right fade-in duration-300
              ${getStyles(toast.type)}
            `}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(toast.type)}
                        </div>
                        <div className="flex-1 flex flex-col items-start">
                            <p className="text-sm font-medium whitespace-pre-line">{toast.message}</p>
                            {toast.details && (
                                <button 
                                    onClick={() => alert(`Technical Detail:\n\n${toast.details}`)}
                                    className="mt-1 text-xs font-semibold underline opacity-80 hover:opacity-100 transition-opacity text-left"
                                >
                                    Technical Detail
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

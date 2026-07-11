import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: PropsWithChildren) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const toast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message: string) => showToast(message, 'error', 5000), [showToast]);
    const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

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

            {/* Toast Container */}
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
                        <p className="flex-1 text-sm font-medium whitespace-pre-line">{toast.message}</p>
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

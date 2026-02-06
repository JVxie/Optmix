import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '@/components/common/Toast';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        setToasts(prev => {
            const newToasts = [{ id, message, type }, ...prev];
            if (newToasts.length > 3) {
                return newToasts.slice(0, 3);
            }
            return newToasts;
        });

        // Auto remove after 2.5s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none pt-[calc(env(safe-area-inset-top)+2rem)]">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

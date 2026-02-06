import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info'
}) => {
    const styles = {
        success: 'bg-emerald-600 border border-emerald-500 text-white shadow-xl shadow-emerald-900/20',
        error: 'bg-red-600 border border-red-500 text-white shadow-xl shadow-red-900/20',
        info: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-lg shadow-slate-200/50 dark:shadow-black/30'
    };

    const icons = {
        success: <CheckCircle size={20} className="shrink-0 text-white" />,
        error: <AlertCircle size={20} className="shrink-0 text-white" />,
        info: <Info size={20} className="shrink-0 text-blue-600 dark:text-blue-400" />
    };

    return (
        <div className="w-full animate-slide-down pointer-events-auto">
            <div className={`${styles[type]} px-6 py-3.5 rounded-xl flex items-center gap-3 font-medium text-base justify-center backdrop-blur-md`}>
                {icons[type]}
                <span>{message}</span>
            </div>
        </div>
    );
};

export default Toast;

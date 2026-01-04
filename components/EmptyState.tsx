import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    message: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    children?: ReactNode; // For extra custom content if needed
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    message,
    icon: Icon,
    actionLabel,
    onAction,
    children
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 text-center animate-in fade-in zoom-in-95 duration-300 transition-colors">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Icon size={32} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>

            <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                {message}
            </p>

            {children}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

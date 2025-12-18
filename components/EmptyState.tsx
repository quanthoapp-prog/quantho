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
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Icon size={32} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

            <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
                {message}
            </p>

            {children}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-100"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

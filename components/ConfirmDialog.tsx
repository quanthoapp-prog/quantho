import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    variant = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
            buttonText: 'text-white'
        },
        warning: {
            icon: 'bg-yellow-100 text-yellow-600',
            button: 'bg-yellow-500 hover:bg-yellow-600',
            buttonText: 'text-white'
        },
        info: {
            icon: 'bg-blue-100 text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            buttonText: 'text-white'
        }
    };

    const style = colors[variant];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto w-full h-full flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full mx-auto p-6 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-full mb-4 ${style.icon}`}>
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${style.button} ${style.buttonText}`}
                        >
                            {isLoading ? 'Attendi...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 24,
    className = "",
    text,
    fullScreen = false
}) => {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className="animate-spin text-blue-600" size={size} />
            {text && <p className="text-sm font-medium text-gray-600 animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;

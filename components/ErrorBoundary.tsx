import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 font-sans">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full border border-red-100">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Si è verificato un errore imprevisto</h1>
                        <p className="text-gray-600 mb-6">
                            Ops! Qualcosa è andato storto nel caricamento dell'applicazione.
                        </p>

                        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-64 mb-6">
                            <code className="text-red-300 font-mono text-xs block whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </code>
                            <code className="text-gray-500 font-mono text-xs block mt-2 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            Ricarica Pagina
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

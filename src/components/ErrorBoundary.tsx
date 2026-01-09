// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================
// Catches JavaScript errors anywhere in the child component tree and displays
// a fallback UI with a retry option.

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console (could be sent to error tracking service)
        console.error("[ErrorBoundary] Caught error:", error);
        console.error("[ErrorBoundary] Error info:", errorInfo);

        this.setState({ errorInfo });

        // TODO: Send to error tracking service like Sentry
        // if (typeof window !== "undefined" && window.Sentry) {
        //   window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Custom fallback provided
            if (fallback) {
                return fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="text-5xl mb-4">😵</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {error?.message || "An unexpected error occurred"}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         transition-colors font-medium"
                        >
                            Try Again
                        </button>
                        {process.env.NODE_ENV === "development" && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                                    {error?.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return children;
    }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((err: Error) => {
        console.error("[useErrorHandler] Error caught:", err);
        setError(err);
    }, []);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    // Throw error to be caught by nearest ErrorBoundary
    if (error) {
        throw error;
    }

    return { handleError, resetError };
}

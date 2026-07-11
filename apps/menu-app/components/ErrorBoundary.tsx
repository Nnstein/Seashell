import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sand p-4 font-sans text-ink">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
            <h2 className="text-2xl font-serif font-bold mb-4">Oops! Something went wrong</h2>
            <p className="text-slate-600 mb-6 text-sm">
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            <div className="bg-red-50 p-4 rounded-lg text-left overflow-auto text-xs text-red-800 mb-6 font-mono border border-red-100 max-h-32">
                {this.state.error?.message || "Unknown error"}
            </div>
            <button
              className="bg-ink text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-gold transition-colors w-full shadow-lg"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

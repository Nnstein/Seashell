import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6 font-sans">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="bg-slate-100 p-4 rounded text-left overflow-auto text-xs text-red-800 mb-6 max-h-32 font-mono">
                {this.state.error?.message || "Unknown error"}
            </div>
            <button
              className="bg-ink text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-gold transition-colors w-full"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

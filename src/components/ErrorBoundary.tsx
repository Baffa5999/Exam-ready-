import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-[#FF6B35]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
            <p className="text-[#8B9CB8] mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left bg-[#1A1A2E] rounded-lg p-4 border border-[rgba(255,255,255,0.08)]">
                <summary className="cursor-pointer font-mono text-sm text-[#FF6B35] mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-[#8B9CB8] overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-[#FF6B35] hover:bg-[#E85A25] text-white font-bold rounded-lg transition"
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

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RaceWizardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RaceWizardErrorBoundary caught an error:', error, errorInfo);
    
    // If it's a DOM manipulation error, try to recover by resetting
    if (error.message.includes('removeChild') || error.message.includes('Node')) {
      console.log('Detected DOM manipulation error, attempting recovery...');
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
        this.props.onReset?.();
      }, 100);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            We encountered an error while loading the race wizard. Please try again.
          </p>
          <div className="space-x-3">
            <Button 
              onClick={this.handleReset}
              variant="outline"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
            >
              Reload Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left max-w-2xl">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default RaceWizardErrorBoundary;

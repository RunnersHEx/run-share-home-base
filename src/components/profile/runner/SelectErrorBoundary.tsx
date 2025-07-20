import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SelectErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SelectErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SelectErrorBoundary extends Component<SelectErrorBoundaryProps, SelectErrorBoundaryState> {
  constructor(props: SelectErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SelectErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Select component error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            There was an issue with the dropdown. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default SelectErrorBoundary;

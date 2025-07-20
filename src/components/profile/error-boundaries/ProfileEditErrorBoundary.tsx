import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileEditErrorBoundaryProps {
  children: ReactNode;
  onResetError?: () => void;
}

interface ProfileEditErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ProfileEditErrorBoundary extends Component<
  ProfileEditErrorBoundaryProps, 
  ProfileEditErrorBoundaryState
> {
  constructor(props: ProfileEditErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProfileEditErrorBoundaryState {
    // Update state to show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.warn('Profile edit error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Track the error for analytics
    if (typeof window !== 'undefined' && (window as any).trackError) {
      (window as any).trackError(error, 'ProfileEditErrorBoundary');
    }
  }

  handleRetry = () => {
    // Reset the error boundary
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Call the optional reset callback
    if (this.props.onResetError) {
      this.props.onResetError();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <div className="space-y-3">
              <p>
                <strong>Ups! Hubo un problema al editar el perfil.</strong>
              </p>
              <p className="text-sm">
                Los cambios se han guardado correctamente, pero la interfaz necesita actualizarse.
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  size="sm"
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  Actualizar página
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2 text-xs text-gray-600">
                  <summary className="cursor-pointer">Detalles técnicos</summary>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ProfileEditErrorBoundary;

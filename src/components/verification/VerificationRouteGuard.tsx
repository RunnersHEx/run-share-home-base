import React from 'react';
import { useVerification } from '@/hooks/useVerification';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationRouteGuardProps {
  children: React.ReactNode;
  allowedPaths?: string[];
}

const VerificationRouteGuard: React.FC<VerificationRouteGuardProps> = ({
  children,
  allowedPaths = ['/profile', '/'],
}) => {
  const { user } = useAuth();
  const { canAccessPlatform, isLoading } = useVerification();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  // If user is not logged in, let normal auth flow handle it
  if (!user) {
    return <>{children}</>;
  }

  // If verification data is still loading, don't restrict yet
  if (isLoading) {
    return <>{children}</>;
  }

  // If user can access platform or is on allowed paths, render normally
  if (canAccessPlatform || allowedPaths.includes(currentPath)) {
    return <>{children}</>;
  }

  // Show verification required page for restricted access
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-20 w-20 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verificación Requerida
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Debes completar la verificación de identidad para acceder a esta página
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <h4 className="font-semibold mb-2">Acceso Restringido</h4>
              <p className="mb-2">
                Para garantizar la seguridad de toda la comunidad, necesitas verificar tu identidad antes de continuar.
              </p>
              <p className="font-semibold">
                Sube los documentos requeridos en tu perfil para acceder a todas las funciones.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/profile', { state: { activeSection: 'verification' } })}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Completar Verificación
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationRouteGuard;

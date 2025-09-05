import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserAccessGuardProps {
  children: React.ReactNode;
  allowedPages?: string[]; // Pages that deactivated users can still access
  restrictedFeatures?: string[]; // Specific features to restrict (like create buttons)
  showCreateRestriction?: boolean; // Whether to show restriction for create actions
}

const UserAccessGuard = ({ 
  children, 
  allowedPages = ['profile', 'messaging'],
  restrictedFeatures = [],
  showCreateRestriction = false
}: UserAccessGuardProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  // If user is not logged in, let other guards handle it
  if (!user) {
    return <>{children}</>;
  }

  // If profile is not loaded yet, allow everything (loading state)
  if (!profile) {
    return <>{children}</>;
  }

  // If user is active, allow everything
  if (profile.is_active !== false) {
    return <>{children}</>;
  }

  // Check if current page is allowed for deactivated users
  const isAllowedPage = allowedPages.some(page => {
    // Handle messaging/messages route compatibility
    if (page === 'messaging') {
      return currentPath.includes('/messages') || currentPath === '/messages' || 
             currentPath.includes('/messaging') || currentPath === '/messaging';
    }
    return currentPath.includes(`/${page}`) || currentPath === `/${page}`;
  });

  // If it's just a create restriction (like create property/race buttons)
  if (showCreateRestriction) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Cuenta desactivada:</strong> No puedes crear nuevas propiedades o carreras. 
            Puedes editar o eliminar las existentes. Revisa los mensajes del administrador para más información.
          </AlertDescription>
        </Alert>
        {/* Don't render the restricted content */}
      </div>
    );
  }

  // If page is not allowed, show restriction message
  if (!isAllowedPage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <span>Cuenta Desactivada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-800 font-medium mb-2">
                Tu cuenta ha sido desactivada por el administrador.
              </p>
              <p className="text-red-700 text-sm">
                Actualmente tienes acceso limitado a la plataforma. Solo puedes ver tu perfil 
                y los mensajes del administrador.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Lo que puedes hacer:</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ver tu perfil
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver mensajes del administrador
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>¿Necesitas ayuda?</strong> Revisa los mensajes del administrador 
                para entender el motivo de la desactivación. Si crees que es un error, 
                contacta al equipo de soporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For allowed pages, render children normally
  return <>{children}</>;
};

export default UserAccessGuard;
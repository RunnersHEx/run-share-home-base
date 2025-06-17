
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md">
          Necesitas iniciar sesión para acceder a esta función
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Ir al inicio
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

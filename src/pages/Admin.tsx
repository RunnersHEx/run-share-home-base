
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AdminVerificationPanel from "@/components/admin/AdminVerificationPanel";

const Admin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // En producción, aquí verificarías si el usuario es admin
  // Por ahora, cualquier usuario autenticado puede acceder

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestiona las verificaciones de usuarios</p>
        </div>
        
        <AdminVerificationPanel />
      </div>
    </div>
  );
};

export default Admin;

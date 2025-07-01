
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminVerificationPanel from "@/components/admin/AdminVerificationPanel";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import PropertyManagementPanel from "@/components/admin/PropertyManagementPanel";
import AdminStatsPanel from "@/components/admin/AdminStatsPanel";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-2">Gestiona usuarios, verificaciones y propiedades</p>
          </div>
          
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stats">Estadísticas del Sistema</TabsTrigger>
              <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
              <TabsTrigger value="verifications">Verificación de Documentos</TabsTrigger>
              <TabsTrigger value="properties">Gestión de Propiedades</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              <AdminStatsPanel />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UserManagementPanel />
            </TabsContent>

            <TabsContent value="verifications" className="space-y-6">
              <AdminVerificationPanel />
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <PropertyManagementPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;

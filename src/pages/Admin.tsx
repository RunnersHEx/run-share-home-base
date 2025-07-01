
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminVerificationPanel from "@/components/admin/AdminVerificationPanel";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import PropertyManagementPanel from "@/components/admin/PropertyManagementPanel";

const Admin = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestiona usuarios, verificaciones y propiedades</p>
        </div>
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
            <TabsTrigger value="verifications">Verificación de Documentos</TabsTrigger>
            <TabsTrigger value="properties">Gestión de Propiedades</TabsTrigger>
          </TabsList>

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
  );
};

export default Admin;

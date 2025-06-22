
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import ProfileLayout from "@/components/profile/ProfileLayout";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import RunnerInfoSection from "@/components/profile/RunnerInfoSection";
import RoleSection from "@/components/profile/RoleSection";
import VerificationSection from "@/components/profile/VerificationSection";
import StatsSection from "@/components/profile/StatsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Trophy, Shield, CheckCircle, BarChart } from "lucide-react";

const Profile = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProfileLayout activeSection={activeSection}>
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="runner" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Runner</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Verificación</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="personal">
            <PersonalInfoSection />
          </TabsContent>
          
          <TabsContent value="runner">
            <RunnerInfoSection />
          </TabsContent>
          
          <TabsContent value="roles">
            <RoleSection />
          </TabsContent>
          
          <TabsContent value="verification">
            <VerificationSection />
          </TabsContent>
          
          <TabsContent value="stats">
            <StatsSection />
          </TabsContent>
        </div>
      </Tabs>
    </ProfileLayout>
  );
};

export default Profile;

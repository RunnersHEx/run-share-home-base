
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import ProfileLayout from "@/components/profile/ProfileLayout";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import RunnerInfoSection from "@/components/profile/RunnerInfoSection";
import RoleSection from "@/components/profile/RoleSection";
import VerificationSection from "@/components/profile/VerificationSection";
import StatsSection from "@/components/profile/StatsSection";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";

const Profile = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "personal":
        return <PersonalInfoSection />;
      case "runner":
        return <RunnerInfoSection />;
      case "roles":
        return <RoleSection />;
      case "verification":
        return <VerificationSection />;
      case "stats":
        return <StatsSection />;
      case "delete-account":
        return <DeleteAccountSection />;
      default:
        return <PersonalInfoSection />;
    }
  };

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={handleSectionChange}>
      {renderActiveSection()}
    </ProfileLayout>
  );
};

export default Profile;

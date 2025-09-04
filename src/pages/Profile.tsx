
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProfileLayout from "@/components/profile/ProfileLayout";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import RunnerInfoSection from "@/components/profile/RunnerInfoSection";
import RoleSection from "@/components/profile/RoleSection";
import VerificationSection from "@/components/profile/VerificationSection";
import StatsSection from "@/components/profile/StatsSection";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";
import PropertiesSection from "@/components/profile/PropertiesSection";
import RacesSection from "@/components/profile/RacesSection";
import BookingsSection from "@/components/profile/BookingsSection";
import SubscriptionSection from "@/components/profile/SubscriptionSection";
import PointsSystemSection from "@/components/profile/PointsSystemSection";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import AdminMessages from "@/components/admin/AdminMessages";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("personal");

  // Check if we need to navigate to a specific section (from verification modal)
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "personal":
        return <PersonalInfoSection />;
      case "runner":
        return <RunnerInfoSection />;
      case "roles":
        return <RoleSection />;
      case "properties":
        return <PropertiesSection />;
      case "races":
        return <RacesSection />;
      case "bookings":
        return <BookingsSection />;
      case "reviews":
        return <ReviewsSection />;
      case "subscription":
        return <SubscriptionSection />;
      case "points":
        return <PointsSystemSection />;
      case "verification":
        return <VerificationSection />;
      case "stats":
        return <StatsSection />;
      case "admin-messages":
        return <AdminMessages userId={user?.id || ''} />;
      case "delete-account":
        return <DeleteAccountSection />;
      default:
        return <PersonalInfoSection />;
    }
  };

  return (
    <ProtectedRoute>
      <ProfileLayout activeSection={activeSection} onSectionChange={handleSectionChange}>
        {renderActiveSection()}
      </ProfileLayout>
    </ProtectedRoute>
  );
};

export default Profile;

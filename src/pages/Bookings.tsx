
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BookingWorkflow from "@/components/bookings/BookingWorkflow";

const Bookings = () => {
  return (
    <ProtectedRoute>
      <BookingWorkflow defaultTab="overview" userRole="both" />
    </ProtectedRoute>
  );
};

export default Bookings;


import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BookingWorkflow from "@/components/bookings/BookingWorkflow";

const Bookings = () => {
  return (
    <ProtectedRoute>
      <BookingWorkflow userRole="both" />
    </ProtectedRoute>
  );
};

export default Bookings;

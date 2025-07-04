
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from "react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProductionWrapper from "@/components/common/ProductionWrapper";

import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { initWebVitalsTracking } from "@/hooks/usePerformanceTracking";
import { analytics } from "@/lib/analytics";
import { PRODUCTION_CONFIG } from "@/lib/productionConfig";
import { initializeSecurity } from "@/lib/security";
import Index from "./pages/Index";
import DiscoverRaces from "./pages/DiscoverRaces";
import Properties from "./pages/Properties";
import Races from "./pages/Races";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PRODUCTION_CONFIG.CACHE_TTL.USER_PROFILE,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    analytics.trackPageView(location.pathname);
  }, [location]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/discover" element={<DiscoverRaces />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/races" element={<Races />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => {
  useEffect(() => {
    // Initialize security measures
    initializeSecurity();
    
    // Initialize performance tracking
    initWebVitalsTracking();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ProductionWrapper>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <AppContent />
                  <Toaster />
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ProductionWrapper>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;

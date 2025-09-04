
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
import emergencyRecaptchaFix from "@/utils/emergency-recaptcha-fix";
import Index from "./pages/Index";
import DiscoverRaces from "./pages/DiscoverRaces";
import Properties from "./pages/Properties";
import Races from "./pages/Races";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import ResetPassword from "./pages/ResetPassword";
import { MessagingPage } from "@/components/messaging";
import UserAccessGuard from "@/components/guards/UserAccessGuard";

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
        <Route path="/" element={
          <UserAccessGuard>
            <Index />
          </UserAccessGuard>
        } />
        <Route path="/discover" element={
          <UserAccessGuard>
            <DiscoverRaces />
          </UserAccessGuard>
        } />
        <Route path="/properties" element={
          <UserAccessGuard>
            <Properties />
          </UserAccessGuard>
        } />
        <Route path="/races" element={
          <UserAccessGuard>
            <Races />
          </UserAccessGuard>
        } />
        <Route path="/bookings" element={
          <UserAccessGuard>
            <Bookings />
          </UserAccessGuard>
        } />
        <Route path="/messages" element={
          <UserAccessGuard allowedPages={['messaging']}>
            <MessagingPage />
          </UserAccessGuard>
        } />
        <Route path="/profile" element={
          <UserAccessGuard allowedPages={['profile']}>
            <Profile />
          </UserAccessGuard>
        } />
        <Route path="/payment-success" element={
          <UserAccessGuard>
            <PaymentSuccess />
          </UserAccessGuard>
        } />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={
          <UserAccessGuard>
            <Admin />
          </UserAccessGuard>
        } />
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
    
    // Global reCAPTCHA interaction handler
    const handleGlobalReCaptchaInteraction = () => {
      // Find all modal overlays and temporarily disable pointer events
      // when reCAPTCHA challenge is active
      const observer = new MutationObserver(() => {
        const recaptchaIframes = document.querySelectorAll('iframe[src*="recaptcha"]');
        const hasActiveChallenge = Array.from(recaptchaIframes).some(iframe => {
          const rect = iframe.getBoundingClientRect();
          return rect.width > 300 && rect.height > 300; // Challenge popup is larger
        });
        
        const modalOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        modalOverlays.forEach(overlay => {
          if (hasActiveChallenge) {
            (overlay as HTMLElement).style.pointerEvents = 'none';
            document.body.classList.add('recaptcha-active');
          } else {
            (overlay as HTMLElement).style.pointerEvents = '';
            document.body.classList.remove('recaptcha-active');
          }
        });
      });
      
      // Observe DOM changes for reCAPTCHA popups
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
      });
      
      return () => observer.disconnect();
    };
    
    const cleanup = handleGlobalReCaptchaInteraction();
    
    // Make emergency reCAPTCHA fix available globally
    (window as any).emergencyRecaptchaFix = emergencyRecaptchaFix;
    
    return () => {
      cleanup();
    };
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


import React, { useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { isProduction, getEnvironmentConfig } from '@/lib/productionConfig';
import { analytics } from '@/lib/analytics';
import { errorTracker } from '@/lib/errorTracking';
import LazyLoader from './LazyLoader';

interface ProductionWrapperProps {
  children: React.ReactNode;
}

const ProductionWrapper = ({ children }: ProductionWrapperProps) => {
  useEffect(() => {
    const config = getEnvironmentConfig();
    
    // Inicializar analytics en producción
    if (isProduction() && config.gaTrackingId) {
      analytics.init(config.gaTrackingId);
    }
    
    // Configurar error tracking
    if (isProduction()) {
      console.log('Production mode: Error tracking enabled');
    }
    
    // Log de configuración (solo en desarrollo)
    if (!isProduction()) {
      console.log('Development mode: Full debugging enabled');
    }
  }, []);

  if (!isProduction()) {
    return <>{children}</>;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#1E40AF" />
        <link rel="canonical" href="https://runners-home-exchange.com" />
        <meta property="og:site_name" content="Runners Home Exchange" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@RunnersHomeEx" />
      </Helmet>
      
      <Suspense fallback={<LazyLoader height="100vh" />}>
        {children}
      </Suspense>
    </>
  );
};

export default ProductionWrapper;


import React, { useEffect, useState } from 'react';
import { PRODUCTION_CONFIG, isProduction } from '@/lib/productionConfig';
import { errorTracker } from '@/lib/errorTracking';

const ProductionMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    errors: 0
  });

  useEffect(() => {
    if (!isProduction()) return;

    const startTime = performance.now();
    
    // Monitor de rendimiento
    const performanceMonitor = setInterval(() => {
      const currentLoadTime = performance.now() - startTime;
      const memoryInfo = (performance as any).memory;
      
      setMetrics(prev => ({
        ...prev,
        loadTime: currentLoadTime,
        memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
        errors: errorTracker.getErrors().length
      }));

      // Alertas de rendimiento
      if (currentLoadTime > PRODUCTION_CONFIG.PERFORMANCE.MAX_LOAD_TIME) {
        console.warn('Performance Warning: Load time exceeded threshold');
      }
    }, 5000);

    // Monitor de errores críticos
    const errorMonitor = setInterval(() => {
      const errors = errorTracker.getErrors();
      const criticalErrors = errors.filter(error => 
        error.message.includes('ChunkLoadError') || 
        error.message.includes('NetworkError')
      );
      
      if (criticalErrors.length > 0) {
        console.error('Critical errors detected:', criticalErrors);
      }
    }, 10000);

    return () => {
      clearInterval(performanceMonitor);
      clearInterval(errorMonitor);
    };
  }, []);

  // Solo mostrar en desarrollo
  if (isProduction()) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div>Load: {Math.round(metrics.loadTime)}ms</div>
      <div>Memory: {Math.round(metrics.memoryUsage)}MB</div>
      <div>Errors: {metrics.errors}</div>
    </div>
  );
};

export default ProductionMonitor;

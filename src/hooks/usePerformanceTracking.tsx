
import { useEffect } from 'react';

interface PerformanceMetrics {
  route: string;
  loadTime: number;
  renderTime: number;
  userAgent: string;
}

export const usePerformanceTracking = (routeName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    const trackMetrics = () => {
      const loadTime = performance.now() - startTime;
      
      // Get web vitals if available
      if ('web-vital' in window) {
        // Implementation for Core Web Vitals
      }
      
      const metrics: PerformanceMetrics = {
        route: routeName,
        loadTime,
        renderTime: performance.now(),
        userAgent: navigator.userAgent
      };
      
      // Send to analytics
      trackPagePerformance(metrics);
    };
    
    // Track after component mount
    setTimeout(trackMetrics, 100);
    
    return () => {
      // Cleanup if needed
    };
  }, [routeName]);
};

const trackPagePerformance = (metrics: PerformanceMetrics) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // Send to Google Analytics
    (window as any).gtag('event', 'page_performance', {
      route: metrics.route,
      load_time: Math.round(metrics.loadTime),
      custom_parameter: 'performance_tracking'
    });
  }
  
  console.log('Performance metrics:', metrics);
};

// Web Vitals tracking
export const initWebVitalsTracking = () => {
  if (typeof window === 'undefined') return;
  
  // Track Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        
        const metrics = {
          dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcp: navEntry.connectEnd - navEntry.connectStart,
          ttfb: navEntry.responseStart - navEntry.requestStart,
          download: navEntry.responseEnd - navEntry.responseStart,
          dom: navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
          total: navEntry.loadEventEnd - navEntry.navigationStart
        };
        
        console.log('Navigation metrics:', metrics);
        
        // Send to analytics
        if ('gtag' in window) {
          (window as any).gtag('event', 'navigation_timing', metrics);
        }
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
  } catch (e) {
    console.log('Performance Observer not supported');
  }
};

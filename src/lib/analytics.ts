
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface EventParams {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

class Analytics {
  private isInitialized = false;
  
  init(trackingId: string): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    // Load Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', trackingId, {
      send_page_view: false // We'll send page views manually
    });
    
    this.isInitialized = true;
  }
  
  trackPageView(path: string, title?: string): void {
    if (!this.isInitialized) return;
    
    window.gtag('config', process.env.REACT_APP_GA_TRACKING_ID, {
      page_path: path,
      page_title: title
    });
  }
  
  trackEvent(params: EventParams): void {
    if (!this.isInitialized) return;
    
    window.gtag('event', params.action, {
      event_category: params.category,
      event_label: params.label,
      value: params.value,
      ...params
    });
  }
  
  // Specific business events
  trackSignup(method: string): void {
    this.trackEvent({
      action: 'sign_up',
      category: 'engagement',
      label: method
    });
  }
  
  trackBookingRequest(raceId: string, points: number): void {
    this.trackEvent({
      action: 'booking_request',
      category: 'conversion',
      label: raceId,
      value: points
    });
  }
  
  trackRaceSearch(query: string): void {
    this.trackEvent({
      action: 'race_search',
      category: 'engagement',
      label: query
    });
  }
  
  trackProfileVerification(): void {
    this.trackEvent({
      action: 'profile_verification',
      category: 'engagement'
    });
  }
  
  trackBookingCompletion(bookingId: string, points: number): void {
    this.trackEvent({
      action: 'booking_completion',
      category: 'conversion',
      label: bookingId,
      value: points
    });
  }
}

export const analytics = new Analytics();

// Auto-initialize in production
if (typeof window !== 'undefined' && process.env.REACT_APP_GA_TRACKING_ID) {
  analytics.init(process.env.REACT_APP_GA_TRACKING_ID);
}

/**
 * Emergency reCAPTCHA Fix Utility
 * Call these functions if reCAPTCHA is still having issues
 */

export const emergencyRecaptchaFix = {
  /**
   * Force fix z-index issues immediately
   */
  fixZIndexIssues: () => {
    console.log('🚨 Applying emergency reCAPTCHA z-index fix...');
    
    // Find all reCAPTCHA related elements and force highest z-index
    const recaptchaElements = [
      'iframe[src*="recaptcha"]',
      '.g-recaptcha',
      '.rc-anchor-container',
      '.rc-imageselect-challenge',
      '.rc-defaultchallenge',
      '.rc-challenge-container',
      'div[style*="z-index: 2147483647"]'
    ];
    
    recaptchaElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.zIndex = '2147483647';
        (el as HTMLElement).style.pointerEvents = 'auto';
        (el as HTMLElement).style.position = 'relative';
      });
    });
    
    // Temporarily disable modal overlays
    const modalOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    modalOverlays.forEach(overlay => {
      (overlay as HTMLElement).style.pointerEvents = 'none';
    });
    
    console.log('✅ Emergency z-index fix applied');
  },

  /**
   * Reset modal pointer events after reCAPTCHA completion
   */
  resetModalEvents: () => {
    console.log('🔄 Resetting modal pointer events...');
    
    const modalOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    modalOverlays.forEach(overlay => {
      (overlay as HTMLElement).style.pointerEvents = '';
    });
    
    document.body.classList.remove('recaptcha-active');
    console.log('✅ Modal events reset');
  },

  /**
   * Force refresh all reCAPTCHA widgets
   */
  refreshAllRecaptcha: () => {
    console.log('🔄 Refreshing all reCAPTCHA widgets...');
    
    if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.reset) {
      // Get all reCAPTCHA widgets and reset them
      const recaptchaContainers = document.querySelectorAll('.g-recaptcha');
      recaptchaContainers.forEach((container, index) => {
        try {
          window.grecaptcha.reset(index);
          console.log(`✅ Reset reCAPTCHA widget ${index}`);
        } catch (error) {
          console.error(`❌ Failed to reset reCAPTCHA widget ${index}:`, error);
        }
      });
    } else {
      console.warn('⚠️ grecaptcha not available');
    }
  },

  /**
   * Complete diagnostic check
   */
  diagnose: () => {
    console.log('🔍 Running reCAPTCHA diagnostic...');
    
    const diagnosis = {
      grecaptchaLoaded: typeof window.grecaptcha !== 'undefined',
      recaptchaIframes: document.querySelectorAll('iframe[src*="recaptcha"]').length,
      recaptchaContainers: document.querySelectorAll('.g-recaptcha').length,
      modalOverlays: document.querySelectorAll('[data-radix-dialog-overlay]').length,
      challengePopups: document.querySelectorAll('.rc-imageselect-challenge, .rc-defaultchallenge').length,
      activeModals: document.querySelectorAll('[data-state="open"]').length
    };
    
    console.table(diagnosis);
    
    // Check z-index conflicts
    const recaptchaIframes = document.querySelectorAll('iframe[src*="recaptcha"]');
    const modalOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    
    console.log('📊 Z-Index Analysis:');
    recaptchaIframes.forEach((iframe, i) => {
      const zIndex = window.getComputedStyle(iframe).zIndex;
      console.log(`reCAPTCHA iframe ${i}: z-index ${zIndex}`);
    });
    
    modalOverlays.forEach((overlay, i) => {
      const zIndex = window.getComputedStyle(overlay).zIndex;
      console.log(`Modal overlay ${i}: z-index ${zIndex}`);
    });
    
    return diagnosis;
  }
};

// Add to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).emergencyRecaptchaFix = emergencyRecaptchaFix;
}

export default emergencyRecaptchaFix;
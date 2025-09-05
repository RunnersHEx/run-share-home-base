/// <reference types="vite/client" />

// Global type declarations for reCAPTCHA debugging tools
declare global {
  interface Window {
    grecaptcha: {
      reset: (widgetId?: number) => void;
      execute: (widgetId?: number) => void;
      render: (container: Element | string, options: object) => number;
    };
    recaptchaDebug: {
      startMonitoring: () => () => void;
      stopMonitoring: () => void;
      getCurrentState: () => object;
    };
    emergencyRecaptchaFix: {
      fixZIndexIssues: () => void;
      resetModalEvents: () => void;
      refreshAllRecaptcha: () => void;
      diagnose: () => object;
    };
  }
}

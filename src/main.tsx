
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/envValidation' // Validate environment variables before app starts
import { logger } from './lib/logger'
import { initializeBackgroundJobs } from './services/backgroundJobScheduler'
import { ErrorSuppressor } from './utils/errorSuppressor'

logger.debug("Application starting");

// Global error handlers for DOM manipulation errors
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections (common with DOM manipulation)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error instanceof Error && ErrorSuppressor.isSafeToIgnore(error)) {
      console.warn('Suppressed unhandled promise rejection (harmless):', error.message);
      event.preventDefault(); // Prevent the error from bubbling up
    }
  });

  // Handle general DOM errors
  window.addEventListener('error', (event) => {
    if (event.error instanceof Error && ErrorSuppressor.isSafeToIgnore(event.error)) {
      console.warn('Suppressed DOM error (harmless):', event.error.message);
      event.preventDefault();
    }
  });
}

// Initialize background jobs for automated booking processes
initializeBackgroundJobs();

const rootElement = document.getElementById("root");

if (rootElement) {
  logger.debug("Creating React root and rendering App");
  createRoot(rootElement).render(<App />);
} else {
  logger.error("Root element not found!");
  throw new Error("Unable to find root element for React application");
}

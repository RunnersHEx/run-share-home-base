
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/envValidation' // Validate environment variables before app starts
import { logger } from './lib/logger'

logger.debug("Application starting");

const rootElement = document.getElementById("root");

if (rootElement) {
  logger.debug("Creating React root and rendering App");
  createRoot(rootElement).render(<App />);
} else {
  logger.error("Root element not found!");
  throw new Error("Unable to find root element for React application");
}

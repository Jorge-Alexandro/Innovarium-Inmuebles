import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignorar advertencias benignas de ResizeObserver o Script error que burbujean en el iframe
if (typeof window !== "undefined") {
  const ignoreBenignErrors = (e: ErrorEvent | PromiseRejectionEvent) => {
    const msg = 'message' in e ? e.message : (e.reason?.message || '');
    if (
      !msg ||
      msg.includes("ResizeObserver") ||
      msg.includes("Script error") ||
      msg === "Script error."
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };

  window.addEventListener("error", ignoreBenignErrors, true);
  window.addEventListener("unhandledrejection", ignoreBenignErrors, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


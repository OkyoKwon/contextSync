import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LandingRoutes } from './landing-routes';
import { useThemeSync } from './hooks/use-theme';
import { useLocaleSync } from './hooks/use-locale-sync';

function LandingApp() {
  useThemeSync();
  useLocaleSync();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LandingRoutes />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>,
);

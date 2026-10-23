import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import AuthProvider from './auth/AuthProvider';
import { queryClient } from './shared/lib/queryClient';
import { ThemeProvider } from './shared/context/ThemeContext';
import { UiProvider } from './shared/contexts/UiContext';
import { ConfirmProvider } from './shared/contexts/ConfirmContext';
import ScrollToTop from './shared/components/ScrollToTop';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './shared/styles/theme.css';
import './shared/styles/responsive.css';

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '720763692805-1ujg3kddpcpk26ki4lm2tam5rqtpp5fc.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UiProvider>
            <ConfirmProvider>
              <BrowserRouter>
                {/* Restaura el scroll al top en cada cambio de ruta */}
                <ScrollToTop />
                <AuthProvider>
                  <App />
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </UiProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
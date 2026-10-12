import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import AuthProvider from './auth/AuthProvider';
import { queryClient } from './shared/lib/queryClient';
import { ThemeProvider } from './shared/context/ThemeContext';
import { UiProvider } from './shared/contexts/UiContext';
import { ConfirmProvider } from './shared/contexts/ConfirmContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './shared/styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UiProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </ConfirmProvider>
        </UiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import AuthProvider from './auth/AuthProvider';
import { queryClient } from './shared/lib/queryClient';
import { ThemeProvider } from './shared/context/ThemeContext';
import { UiProvider } from './shared/contexts/UiContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './shared/styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UiProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </UiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
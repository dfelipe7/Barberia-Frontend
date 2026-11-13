import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WhatsAppStatusIndicator from './WhatsAppStatusIndicator';
import { whatsappService } from '../../features/whatsapp/api/whatsapp.service';
import * as AuthContext from '../../auth/AuthContext';

vi.mock('../../features/whatsapp/api/whatsapp.service', () => ({
  whatsappService: {
    getStatus: vi.fn(),
  },
}));

describe('WhatsAppStatusIndicator', () => {
  let queryClient: QueryClient;

  const mockUseAuth = (roles: string[], isAuthenticated = true) => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated,
      roles,
      usuario: { id: 1, email: 'admin@barberia.com' },
      nombre: 'Carlos',
      apellido: 'Admin',
      email: 'admin@barberia.com',
      token: 'fake-jwt',
      fotoUrl: null,
      usuarioDb: null,
      iniciarSesion: vi.fn(),
      cerrarSesion: vi.fn(),
      actualizarUsuarioDb: vi.fn(),
    } as any);
  };

  const renderComponent = () => {
    window.history.pushState({}, '', '/kyrios-studio/dashboard');
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/kyrios-studio/dashboard']}>
          <WhatsAppStatusIndicator />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, '', '/kyrios-studio/dashboard');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('no se renderiza si el usuario no está autenticado', () => {
    mockUseAuth(['ADMINISTRADOR'], false);
    const { container } = renderComponent();
    expect(container).toBeEmptyDOMElement();
  });

  it('no se renderiza si el usuario no tiene rol de administración', () => {
    mockUseAuth(['CLIENTE'], true);
    const { container } = renderComponent();
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra estado conectado cuando WhatsApp está online', async () => {
    mockUseAuth(['ADMINISTRADOR'], true);
    vi.mocked(whatsappService.getStatus).mockResolvedValue({
      conectado: true,
      qr: null,
    });

    renderComponent();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /whatsapp conectado/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/kyrios-studio/whatsapp');
    }, { timeout: 3500 });
  });

  it('muestra advertencia offline cuando WhatsApp está desconectado', async () => {
    mockUseAuth(['ADMINISTRADOR'], true);
    vi.mocked(whatsappService.getStatus).mockResolvedValue({
      conectado: false,
      qr: 'data:image/png;base64,...',
    });

    renderComponent();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /whatsapp desconectado/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/kyrios-studio/whatsapp');
      expect(screen.getByText(/whatsapp offline/i)).toBeInTheDocument();
    }, { timeout: 3500 });
  });

  it('muestra advertencia offline si la consulta falla con error', async () => {
    mockUseAuth(['SUPERADMIN'], true);
    vi.mocked(whatsappService.getStatus).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /whatsapp desconectado/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('title', expect.stringContaining('Error al verificar WhatsApp'));
    }, { timeout: 3500 });
  });
});

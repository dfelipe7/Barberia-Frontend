import axios from 'axios';
import apiClient, { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import type {
  ClienteSesionDTO,
  PerfilClienteDTO,
  ActualizarPerfilClienteDTO,
  ClienteSesionResponseDTO,
  BarberoDisponibleReservaDTO,
  CrearReservaDTO,
  DisponibilidadReservaDTO,
  FiltroDisponibilidadReservaDTO,
  MisReservasDTO,
  ReservaClienteDTO,
  ReservaCreadaDTO,
  ActualizarReservaDTO,
  AgendaSemanalBarberoDTO,
  ClienteAdministrativoDTO,
  CrearReservaAdministrativaDTO,
  ClientesAdministrativosResponseDTO,
  FiltroReservasAdministrativasDTO,
  ReservaAdministrativaDTO,
  ReservaAccionDTO,
  ReservaModificadaDTO,
} from './reservas.dto';

const TOKEN_CLIENTE_KEY = 'token_cliente_barberia';
const SESION_CLIENTE_KEY = 'cliente_barberia';
const TOKEN_INVITADO_PREFIX = 'reserva_invitado_gestion_';
const TOKEN_GESTION_HEADER = 'X-Reservation-Management-Token';

const reservasApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Este cliente gestiona las peticiones del portal público y del flujo de reservas.
reservasApiClient.interceptors.request.use((config) => {
  // 1. Multitenant: Inyectar la cabecera X-Negocio-Slug para resolver la barbería activa
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    config.headers['X-Negocio-Slug'] = slug;
  }

  // 2. Adjuntar el JWT de cliente (si existe)
  const tokenCliente = localStorage.getItem(TOKEN_CLIENTE_KEY);
  if (tokenCliente) {
    config.headers.Authorization = 'Bearer ' + tokenCliente;
  }
  return config;
});

reservasApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la sesión de cliente es rechazada (401 expirada o 403 sesión de otra barbería / inválida),
    // limpiamos automáticamente los datos locales de cliente para que la UI no quede bloqueada.
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      const url = error.config?.url || '';
      if (url.includes('/reservas/me') || url.includes('/auth/clientes')) {
        localStorage.removeItem(TOKEN_CLIENTE_KEY);
        localStorage.removeItem(SESION_CLIENTE_KEY);
      }
    }
    return Promise.reject(error);
  },
);

export const clientesService = {
  async iniciarSesionGoogle(idToken: string): Promise<ClienteSesionResponseDTO> {
    const response = await reservasApiClient.post<ClienteSesionResponseDTO>(
      '/auth/clientes/google',
      { idToken },
    );
    return response.data;
  },

  guardarSesion(sesion: ClienteSesionResponseDTO) {
    localStorage.setItem(TOKEN_CLIENTE_KEY, sesion.accessToken);
    localStorage.setItem(SESION_CLIENTE_KEY, JSON.stringify(sesion.cliente));
  },

  obtenerSesion(): ClienteSesionDTO | null {
    if (!localStorage.getItem(TOKEN_CLIENTE_KEY)) return null;
    const guardada = localStorage.getItem(SESION_CLIENTE_KEY);
    if (!guardada) return null;
    try {
      return JSON.parse(guardada) as ClienteSesionDTO;
    } catch {
      return null;
    }
  },

  async obtenerPerfil(): Promise<PerfilClienteDTO> {
    const response = await reservasApiClient.get<PerfilClienteDTO>('/auth/clientes/perfil');
    return response.data;
  },

  async actualizarPerfil(datos: ActualizarPerfilClienteDTO): Promise<PerfilClienteDTO> {
    const response = await reservasApiClient.patch<PerfilClienteDTO>('/auth/clientes/perfil', datos);
    const sesionActual = this.obtenerSesion();
    if (sesionActual) {
      this.guardarSesion({
        accessToken: localStorage.getItem(TOKEN_CLIENTE_KEY) || '',
        cliente: {
          ...sesionActual,
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          email: response.data.email,
        },
      });
    }
    return response.data;
  },

  cerrarSesion() {
    localStorage.removeItem(TOKEN_CLIENTE_KEY);
    localStorage.removeItem(SESION_CLIENTE_KEY);
  },
};

export const reservasService = {
  async obtenerBarberosPorServicio(servicioId: number): Promise<BarberoDisponibleReservaDTO[]> {
    const response = await reservasApiClient.get<BarberoDisponibleReservaDTO[]>(
      '/servicios/' + servicioId + '/barberos',
    );
    return response.data;
  },

  async obtenerDisponibilidad(
    filtro: FiltroDisponibilidadReservaDTO,
  ): Promise<DisponibilidadReservaDTO> {
    const endpoint = '/usuarios/barberos/' + filtro.barberoId + '/disponibilidad';
    const response = await reservasApiClient.get<DisponibilidadReservaDTO>(endpoint, {
      params: { servicioId: filtro.servicioId, fecha: filtro.fecha },
    });
    return response.data;
  },

  async crearReserva(datos: CrearReservaDTO): Promise<ReservaCreadaDTO> {
    const response = await reservasApiClient.post<ReservaCreadaDTO>('/reservas', datos);
    if (response.data.tokenGestion) {
      sessionStorage.setItem(TOKEN_INVITADO_PREFIX + response.data.id, response.data.tokenGestion);
    }
    return response.data;
  },

  guardarTokenGestionInvitado(id: number, token: string) {
    sessionStorage.setItem(TOKEN_INVITADO_PREFIX + id, token);
  },

  obtenerTokenGestionInvitado(id: number): string | null {
    return sessionStorage.getItem(TOKEN_INVITADO_PREFIX + id);
  },

  async obtenerReservaInvitado(id: number, token: string): Promise<ReservaClienteDTO> {
    const response = await reservasApiClient.get<ReservaClienteDTO>(
      '/reservas/invitado/' + id,
      {
        headers: { [TOKEN_GESTION_HEADER]: token },
        params: { token },
      },
    );
    return response.data;
  },

  eliminarTokenGestionInvitado(id: number) {
    sessionStorage.removeItem(TOKEN_INVITADO_PREFIX + id);
  },

  async modificarReservaInvitado(id: number, token: string, datos: ActualizarReservaDTO): Promise<ReservaModificadaDTO> {
    const response = await reservasApiClient.patch<ReservaModificadaDTO>(
      '/reservas/invitado/' + id,
      datos,
      { headers: { [TOKEN_GESTION_HEADER]: token } },
    );
    return response.data;
  },

  async cancelarReservaInvitado(id: number, token: string): Promise<ReservaAccionDTO> {
    const response = await reservasApiClient.patch<ReservaAccionDTO>(
      '/reservas/invitado/' + id + '/cancelar',
      undefined,
      { headers: { [TOKEN_GESTION_HEADER]: token } },
    );
    return response.data;
  },

  async listarMisReservas(): Promise<MisReservasDTO> {
    const response = await reservasApiClient.get<MisReservasDTO>('/reservas/me');
    return response.data;
  },

  async obtenerMiReserva(id: number): Promise<ReservaClienteDTO> {
    const response = await reservasApiClient.get<ReservaClienteDTO>('/reservas/me/' + id);
    return response.data;
  },

  async modificarMiReserva(id: number, datos: ActualizarReservaDTO): Promise<ReservaModificadaDTO> {
    const response = await reservasApiClient.patch<ReservaModificadaDTO>('/reservas/me/' + id, datos);
    return response.data;
  },

  async cancelarMiReserva(id: number): Promise<{ mensaje: string }> {
    const response = await reservasApiClient.patch<{ mensaje: string }>(
      '/reservas/me/' + id + '/cancelar',
    );
    return response.data;
  },

  async obtenerAgendaSemanalBarbero(desde: string, hasta: string): Promise<AgendaSemanalBarberoDTO> {
    const response = await apiClient.get<AgendaSemanalBarberoDTO>('/reservas/barbero/me/agenda', {
      params: { desde, hasta },
    });
    return response.data;
  },

  async buscarClientesAdministrativos(busqueda: string): Promise<ClienteAdministrativoDTO[]> {
    const response = await apiClient.get<ClienteAdministrativoDTO[] | ClientesAdministrativosResponseDTO>('/reservas/admin/clientes', {
      params: { termino: busqueda },
    });
    return Array.isArray(response.data) ? response.data : response.data.clientes;
  },

  async crearReservaAdministrativa(
    datos: CrearReservaAdministrativaDTO,
  ): Promise<ReservaCreadaDTO> {
    const response = await apiClient.post<ReservaCreadaDTO>('/reservas/admin', datos);
    if (response.data.tokenGestion) {
      sessionStorage.setItem(TOKEN_INVITADO_PREFIX + response.data.id, response.data.tokenGestion);
    }
    return response.data;
  },

  async listarReservasAdministrativas(
    filtro: FiltroReservasAdministrativasDTO = {},
  ): Promise<ReservaAdministrativaDTO[]> {
    const response = await apiClient.get<ReservaAdministrativaDTO[]>('/reservas/admin', { params: filtro });
    return response.data;
  },

  async obtenerReservaAdministrativa(id: number): Promise<ReservaAdministrativaDTO> {
    const response = await apiClient.get<ReservaAdministrativaDTO>('/reservas/admin/' + id);
    return response.data;
  },

  async modificarReservaAdministrativa(id: number, datos: ActualizarReservaDTO): Promise<ReservaModificadaDTO> {
    const response = await apiClient.patch<ReservaModificadaDTO>('/reservas/admin/' + id, datos);
    return response.data;
  },

  async cancelarReservaAdministrativa(id: number): Promise<ReservaAccionDTO> {
    const response = await apiClient.patch<ReservaAccionDTO>('/reservas/admin/' + id + '/cancelar');
    return response.data;
  },

  async completarReserva(id: number): Promise<ReservaAccionDTO> {
    const response = await apiClient.patch<ReservaAccionDTO>('/reservas/' + id + '/completar');
    return response.data;
  },

  async marcarReservaNoAsistida(id: number): Promise<ReservaAccionDTO> {
    const response = await apiClient.patch<ReservaAccionDTO>('/reservas/' + id + '/no-show');
    return response.data;
  },
};

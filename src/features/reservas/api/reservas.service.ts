import axios from 'axios';
import apiClient from '../../../shared/lib/http/axios';
import type {
  ClienteSesionDTO,
  ClienteSesionResponseDTO,
  BarberoDisponibleReservaDTO,
  CrearReservaDTO,
  DisponibilidadReservaDTO,
  FiltroDisponibilidadReservaDTO,
  MisReservasDTO,
  ReservaClienteDTO,
  ReservaCreadaDTO,
  ActualizarReservaDTO,
  DescuentoAplicadoDTO,
  ValidarDescuentoDTO,
  AgendaSemanalBarberoDTO,
  ClienteAdministrativoDTO,
  CrearReservaAdministrativaDTO,
  ClientesAdministrativosResponseDTO,
} from './reservas.dto';

const TOKEN_CLIENTE_KEY = 'token_cliente_barberia';
const SESION_CLIENTE_KEY = 'cliente_barberia';

const reservasApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Este cliente solo adjunta el JWT de cliente. Nunca envía por accidente el JWT del personal.
reservasApiClient.interceptors.request.use((config) => {
  const tokenCliente = localStorage.getItem(TOKEN_CLIENTE_KEY);
  if (tokenCliente) {
    config.headers.Authorization = 'Bearer ' + tokenCliente;
  }
  return config;
});

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

  // Rutas previstas para las historias nuevas; se ajustarán al Swagger que publique backend.
  async modificarMiReserva(id: number, datos: ActualizarReservaDTO): Promise<ReservaClienteDTO> {
    const response = await reservasApiClient.patch<ReservaClienteDTO>('/reservas/me/' + id, datos);
    return response.data;
  },

  async cancelarMiReserva(id: number): Promise<{ mensaje: string }> {
    const response = await reservasApiClient.patch<{ mensaje: string }>(
      '/reservas/me/' + id + '/cancelar',
    );
    return response.data;
  },

  async validarDescuento(datos: ValidarDescuentoDTO): Promise<DescuentoAplicadoDTO> {
    const response = await reservasApiClient.post<DescuentoAplicadoDTO>('/descuentos/validar', datos);
    return response.data;
  },

  async obtenerAgendaSemanalBarbero(desde: string, hasta: string): Promise<AgendaSemanalBarberoDTO> {
    const response = await apiClient.get<AgendaSemanalBarberoDTO>('/reservas/barbero/me/agenda', {
      params: { desde, hasta },
    });
    return response.data;
  },

  async buscarClientesAdministrativos(busqueda: string): Promise<ClienteAdministrativoDTO[]> {
    const response = await apiClient.get<ClienteAdministrativoDTO[] | ClientesAdministrativosResponseDTO>('/clientes/gestion', {
      params: { busqueda },
    });
    return Array.isArray(response.data) ? response.data : response.data.clientes;
  },

  async crearReservaAdministrativa(
    datos: CrearReservaAdministrativaDTO,
  ): Promise<ReservaCreadaDTO> {
    const response = await apiClient.post<ReservaCreadaDTO>('/reservas/admin', datos);
    return response.data;
  },
};

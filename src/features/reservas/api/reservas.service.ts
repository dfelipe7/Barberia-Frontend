import axios from 'axios';
import { googleLogout } from '@react-oauth/google';
import apiClient, { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { queryClient } from '../../../shared/lib/queryClient';
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

const TOKEN_INVITADO_PREFIX = 'reserva_invitado_gestion_';
const TOKEN_GESTION_HEADER = 'X-Reservation-Management-Token';

/**
 * Resuelve las claves de localStorage aisladas por cada barbería para evitar
 * que el token o la sesión de una sede colisione o contamine a otra.
 */
function resolverClavesCliente(slugParam?: string | null) {
  const rawSlug = slugParam || obtenerNegocioSlugActivo();
  const slug = (rawSlug && rawSlug.trim() !== '') ? rawSlug.toLowerCase().trim() : 'global';
  return {
    tokenKey: `token_cliente_${slug}`,
    sesionKey: `cliente_${slug}`,
    slug,
  };
}

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

  // 2. Adjuntar el JWT de cliente específico para esta barbería
  const tokenCliente = clientesService.obtenerToken(slug);
  if (tokenCliente) {
    config.headers.Authorization = 'Bearer ' + tokenCliente;
  } else {
    delete config.headers.Authorization;
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
        const slug = obtenerNegocioSlugActivo();
        clientesService.cerrarSesion(slug);
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Servicio de gestión de autenticación, perfil y ciclo de vida de sesiones de cliente.
 */
export const clientesService = {
  /**
   * Autentica a un cliente utilizando una credencial JWT emitida por Google Identity Services.
   *
   * @param idToken - Credencial JWT de Google generada tras el login del cliente en el popup.
   * @param slugParam - Slug opcional de la barbería para forzar el contexto multitenant.
   * @returns Datos de la sesión iniciada incluyendo token JWT propio y perfil de usuario.
   */
  async iniciarSesionGoogle(idToken: string, slugParam?: string | null): Promise<ClienteSesionResponseDTO> {
    const headers: Record<string, string> = {};
    if (slugParam) {
      headers['X-Negocio-Slug'] = slugParam;
    }
    const response = await reservasApiClient.post<ClienteSesionResponseDTO>(
      '/auth/clientes/google',
      { idToken },
      { headers },
    );
    return response.data;
  },

  /**
   * Almacena en almacenamiento local aislado el token y los datos de perfil del cliente.
   * Purga automáticamente las cachés de React Query para garantizar frescura de datos.
   *
   * @param sesion - Datos de la sesión devueltos por el backend.
   * @param slugParam - Slug opcional de la barbería para aislar el almacenamiento por tenant.
   */
  guardarSesion(sesion: ClienteSesionResponseDTO, slugParam?: string | null) {
    const { tokenKey, sesionKey, slug } = resolverClavesCliente(slugParam);
    const clienteConSlug = { ...sesion.cliente, negocioSlug: slug };
    localStorage.setItem(tokenKey, sesion.accessToken);
    localStorage.setItem(sesionKey, JSON.stringify(clienteConSlug));
    // Purgar caché residual previa para que el cliente entrante tenga datos 100% frescos
    queryClient.removeQueries({ queryKey: ['clientes'] });
    queryClient.removeQueries({ queryKey: ['reservas', 'mis-reservas'] });
  },

  /**
   * Recupera la sesión activa del cliente para la barbería especificada o activa.
   *
   * @param slugParam - Slug opcional de la barbería.
   * @returns Datos de sesión del cliente o null si no hay sesión activa.
   */
  obtenerSesion(slugParam?: string | null): ClienteSesionDTO | null {
    const { tokenKey, sesionKey } = resolverClavesCliente(slugParam);
    const raw = localStorage.getItem(sesionKey);
    const token = localStorage.getItem(tokenKey);

    if (!token || !raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  obtenerToken(slugParam?: string | null): string | null {
    const { tokenKey } = resolverClavesCliente(slugParam);
    return localStorage.getItem(tokenKey);
  },

  /**
   * Cierra la sesión activa del cliente, elimina tokens aislados y desconecta Google Identity.
   *
   * @param slugParam - Slug opcional de la barbería de la que se desea cerrar sesión.
   */
  cerrarSesion(slugParam?: string | null) {
    const { tokenKey, sesionKey, slug } = resolverClavesCliente(slugParam);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(sesionKey);
    if (slug !== 'global') {
      localStorage.removeItem('token_cliente_global');
      localStorage.removeItem('cliente_global');
    }
    // Deshabilitar la autoselección de cuenta en Google Identity Services para permitir escoger otra cuenta
    try {
      googleLogout();
    } catch {}
    // Purgar inmediatamente las consultas en memoria de React Query asociadas al cliente anterior
    queryClient.removeQueries({ queryKey: ['clientes'] });
    queryClient.removeQueries({ queryKey: ['reservas', 'mis-reservas'] });
  },

  async obtenerPerfil(): Promise<PerfilClienteDTO> {
    const response = await reservasApiClient.get<PerfilClienteDTO>('/auth/clientes/perfil');
    return response.data;
  },

  async actualizarPerfil(datos: ActualizarPerfilClienteDTO): Promise<PerfilClienteDTO> {
    const response = await reservasApiClient.patch<PerfilClienteDTO>('/auth/clientes/perfil', datos);
    const slug = obtenerNegocioSlugActivo();
    const sesionActual = this.obtenerSesion(slug);
    if (sesionActual) {
      const { tokenKey } = resolverClavesCliente(slug);
      const token = localStorage.getItem(tokenKey) || '';
      this.guardarSesion({
        accessToken: token,
        cliente: {
          ...sesionActual,
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          email: response.data.email,
        },
      }, slug);
    }
    return response.data;
  },
};

/**
 * Servicio principal de gestión de reservas para el portal de clientes e invitados.
 */
export const reservasService = {
  /**
   * Obtiene la lista de barberos disponibles capacitados para realizar un servicio específico.
   *
   * @param servicioId - Identificador único del servicio seleccionado.
   * @returns Lista de barberos asignados a dicho servicio.
   */
  async obtenerBarberosPorServicio(servicioId: number): Promise<BarberoDisponibleReservaDTO[]> {
    const response = await reservasApiClient.get<BarberoDisponibleReservaDTO[]>(
      '/servicios/' + servicioId + '/barberos',
    );
    return response.data;
  },

  /**
   * Consulta los horarios y franjas disponibles para un barbero, servicio y fecha dados.
   *
   * @param filtro - Criterios de búsqueda (barberoId, servicioId, fecha YYYY-MM-DD).
   * @returns Mapa de disponibilidad con slots libres, ocupados o bloqueados.
   */
  async obtenerDisponibilidad(
    filtro: FiltroDisponibilidadReservaDTO,
  ): Promise<DisponibilidadReservaDTO> {
    const endpoint = '/usuarios/barberos/' + filtro.barberoId + '/disponibilidad';
    const response = await reservasApiClient.get<DisponibilidadReservaDTO>(endpoint, {
      params: { servicioId: filtro.servicioId, fecha: filtro.fecha },
    });
    return response.data;
  },

  /**
   * Crea una nueva reserva (como cliente autenticado o como invitado).
   * Si es invitado, almacena automáticamente el token de gestión en sessionStorage.
   *
   * @param datos - Datos de la reserva (barberoId, servicioId, fecha, hora y datos de contacto si es invitado).
   * @returns Comprobante de la reserva creada con su id y token de gestión si aplica.
   */
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

  /**
   * Obtiene el detalle de una cita agendada por un invitado validando su token de gestión.
   *
   * @param id - Identificador de la reserva.
   * @param token - Token criptográfico de gestión entregado al crear la cita.
   * @returns Detalle completo de la reserva.
   */
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

  /**
   * Cancela la cita de un invitado de forma segura mediante su token de gestión.
   *
   * @param id - Identificador de la reserva a cancelar.
   * @param token - Token de gestión de la reserva.
   * @returns Confirmación de cancelación.
   */
  async cancelarReservaInvitado(id: number, token: string): Promise<ReservaAccionDTO> {
    const response = await reservasApiClient.patch<ReservaAccionDTO>(
      '/reservas/invitado/' + id + '/cancelar',
      undefined,
      { headers: { [TOKEN_GESTION_HEADER]: token } },
    );
    return response.data;
  },

  /**
   * Consulta el historial y las próximas reservas del cliente autenticado.
   *
   * @returns Lista de reservas activas e históricas del cliente.
   */
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

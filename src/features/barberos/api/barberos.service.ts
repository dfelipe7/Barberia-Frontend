import apiClient from '../../../shared/lib/http/axios';
import type {
  BarberoCatalogoDTO,
  BarberoGestionDTO,
  CrearBarberoDTO,
  ActualizarComisionDTO,
  CambiarEstadoBarberoDTO,
} from './barberos.dto';

/**
 * SERVICIO HTTP PURO (Capa API de Barberos):
 * Encapsula las operaciones REST directas sobre el recurso de barberos en el backend.
 */
export const barberosService = {
  /**
   * Obtiene la lista pública de barberos activos asignados a la barbería actual para el catálogo y reservas.
   *
   * @returns Promesa con el arreglo de barberos para catálogo público.
   */
  async obtenerBarberos(): Promise<BarberoCatalogoDTO[]> {
    const response = await apiClient.get<BarberoCatalogoDTO[]>('/usuarios/barberos');
    return response.data;
  },

  /**
   * Obtiene la lista administrativa de barberos de la sede con detalles de comisión, estado y usuarios asociados.
   *
   * @param filtro - Filtro opcional por estado (`ACTIVO` / `INACTIVO`) o coincidencia por nombre.
   * @returns Promesa con los barberos para la grilla de gestión interna.
   */
  async obtenerBarberosGestion(filtro?: {
    estado?: 'ACTIVO' | 'INACTIVO';
    nombre?: string;
  }): Promise<BarberoGestionDTO[]> {
    const response = await apiClient.get<BarberoGestionDTO[]>('/usuarios/barberos/gestion', {
      params: filtro,
    });
    return response.data;
  },

  /**
   * Registra y vincula un nuevo barbero a la barbería activa.
   *
   * @param datos - Datos requeridos (nombre, email, teléfono, porcentaje de comisión).
   */
  async crearBarbero(datos: CrearBarberoDTO): Promise<void> {
    const response = await apiClient.post('/usuarios/barberos', datos);
    return response.data;
  },

  /**
   * Modifica el estado operativo de un barbero dentro de la sede (`ACTIVO` o `INACTIVO`).
   *
   * @param id - Identificador numérico del barbero.
   * @param datos - DTO con el nuevo estado y motivo de auditoría.
   * @returns Mensaje de confirmación del backend.
   */
  async cambiarEstadoBarbero(
    id: number,
    datos: CambiarEstadoBarberoDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/barberos/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Cambia el estado a nivel de cuenta de usuario global para suspender o reactivar su acceso.
   *
   * @param id - Identificador numérico del usuario.
   * @param datos - Nuevo estado y motivo.
   * @param tipo - Alcance del cambio (`barbero` o `ambos`).
   * @returns Mensaje de confirmación del backend.
   */
  async cambiarEstadoGlobalBarbero(
    id: number,
    datos: CambiarEstadoBarberoDTO,
    tipo: 'barbero' | 'ambos' = 'barbero'
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, {
      ...datos,
      tipo,
    });
    return response.data;
  },

  /**
   * Actualiza el porcentaje de comisión pactado para un barbero en la barbería.
   *
   * @param id - Identificador del barbero.
   * @param datos - DTO con el nuevo porcentaje numérico.
   * @returns Mensaje de confirmación.
   */
  async actualizarComision(
    id: number,
    datos: ActualizarComisionDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/barberos/${id}/comision`, datos);
    return response.data;
  },

  /**
   * Permite al barbero autenticado subir su propia foto de perfil.
   *
   * @param file - Archivo de imagen seleccionado.
   * @returns Objeto con la nueva URL pública de la foto y mensaje de éxito.
   */
  async subirFotoPropia(file: File): Promise<{ fotoUrl: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post('/usuarios/barberos/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Elimina la foto de perfil del barbero autenticado.
   *
   * @returns Mensaje de confirmación.
   */
  async eliminarFotoPropia(): Promise<{ mensaje: string }> {
    const response = await apiClient.delete('/usuarios/barberos/foto');
    return response.data;
  },
  
  /**
   * Permite a un administrador subir o reemplazar la foto de perfil de cualquier barbero.
   *
   * @param id - Identificador del barbero.
   * @param file - Archivo de imagen.
   * @returns Objeto con la nueva URL pública y mensaje.
   */
  async subirFotoAdmin(id: number, file: File): Promise<{ fotoUrl: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post(`/usuarios/barberos/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

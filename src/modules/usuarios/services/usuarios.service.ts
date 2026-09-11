import api from '../../../services/api';
export interface Usuario {
  id: number;
  keycloakId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  estado: 'ACTIVO' | 'INACTIVO';
  administrador?: {
    id: number;
    usuarioId: number;
    estado: 'ACTIVO' | 'INACTIVO';
  } | null;
  barbero?: {
    id: number;
    usuarioId: number;
    telefono: string;
    porcentajeComision: number;
    fotoUrl?: string | null;
    estado: 'ACTIVO' | 'INACTIVO';
  } | null;
}

export interface BarberoCatalogo {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  fotoUrl?: string | null;
}

export interface AdministradorGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  estadoAdmin?: 'ACTIVO' | 'INACTIVO';
  esBarbero: boolean;
  estadoBarbero?: 'ACTIVO' | 'INACTIVO';
}

export interface BarberoGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  porcentajeComision: number;
  estado: 'ACTIVO' | 'INACTIVO';
  estadoAdmin?: 'ACTIVO' | 'INACTIVO';
  estadoGlobal: 'ACTIVO' | 'INACTIVO';
  esAdministrador: boolean;
  fotoUrl?: string | null;
}



export interface CrearBarbero {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  porcentajeComision: number;
}

export interface CrearAdministrador {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
}

export interface ActualizarUsuario {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  porcentajeComision?: number;
  esAdministrador?: boolean;
  esBarbero?: boolean;
  fotoUrl?: string;
}

export interface ActualizarComision {
  porcentajeComision: number;
}

export interface CambiarEstado {
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ConfigurarBarbero {
  telefono: string;
  porcentajeComision: number;
}

export const usuariosService = {
  /**
   * Obtiene el perfil completo del usuario autenticado actual usando el token de Keycloak.
   * Se usa comúnmente al inicializar la aplicación.
   */
  async obtenerMiPerfil() {
    const response = await api.get<Usuario>('/usuarios/me');
    return response.data;
  },

  /**
   * Obtiene los datos básicos de cualquier usuario por su ID.
   * Útil para vistas de detalle o formularios de edición.
   */
  async obtenerUsuario(id: number) {
    const response = await api.get<Usuario>(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Obtiene el catálogo público de barberos activos.
   * No incluye datos sensibles (como comisiones o correos).
   * Diseñado para la vista de reservas de clientes.
   */
  async obtenerBarberos() {
    const response = await api.get<BarberoCatalogo[]>('/usuarios/barberos');
    return response.data;
  },

  /**
   * Obtiene la lista completa de administradores.
   * Exclusivo para el uso del SUPERADMIN.
   */
  async obtenerAdministradores() {
    const response = await api.get<AdministradorGestion[]>('/usuarios/administradores');
    return response.data;
  },

  /**
   * Obtiene la lista de barberos con datos sensibles (comisión, email, estado).
   * Exclusivo para la tabla de gestión de los administradores y superadmin.
   */
  async obtenerBarberosGestion() {
    const response = await api.get<BarberoGestion[]>('/usuarios/barberos/gestion');
    return response.data;
  },

  /**
   * Registra a un nuevo administrador en Keycloak y en la base de datos.
   */
  async crearAdministrador(datos: CrearAdministrador) {
    const response = await api.post('/usuarios/administradores', datos);
    return response.data;
  },

  /**
   * Registra a un nuevo empleado como barbero directamente.
   * Crea su cuenta en Keycloak y le asigna el rol de BARBERO.
   */
  async crearBarbero(datos: CrearBarbero) {
    const response = await api.post('/usuarios/barberos', datos);
    return response.data;
  },

  /**
   * Actualiza los datos personales básicos (nombre, apellido, email) de un usuario.
   */
  async actualizarUsuario(id: number, datos: ActualizarUsuario) {
    const response = await api.patch<Usuario>(`/usuarios/${id}`, datos);
    return response.data;
  },

  /**
   * Activa o desactiva la CUENTA GLOBAL de un usuario.
   * Si se desactiva, el usuario no podrá iniciar sesión en absoluto.
   */
  async cambiarEstado(id: number, datos: CambiarEstado) {
    const response = await api.patch(`/usuarios/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Activa o desactiva exclusivamente el PERFIL DE BARBERO.
   * Si se desactiva, deja de aparecer en el catálogo, pero aún puede iniciar sesión.
   */
  async cambiarEstadoBarbero(id: number, datos: CambiarEstado) {
    const response = await api.patch(`/usuarios/barberos/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Modifica el porcentaje de comisión que recibe un barbero por sus servicios.
   */
  async actualizarComision(id: number, datos: ActualizarComision) {
    const response = await api.patch(`/usuarios/barberos/${id}/comision`, datos);
    return response.data;
  },

  /**
   * Convierte a un usuario existente (ej. un administrador) en barbero.
   * Operación realizada por un SUPERADMIN.
   */
  async configurarBarbero(id: number, datos: ConfigurarBarbero) {
    const response = await api.post(`/usuarios/${id}/barbero`, datos);
    return response.data;
  },

  /**
   * Permite que el usuario autenticado (ej. un administrador) se auto-asigne
   * el perfil de barbero con su respectiva comisión y teléfono.
   */
  async configurarMeComoBarbero(datos: ConfigurarBarbero) {
    const response = await api.post('/usuarios/me/barbero', datos);
    return response.data;
  },

  /**
   * Cambia el estado del rol de Administrador de un usuario.
   */
  async cambiarEstadoAdministrador(id: number, datos: { estado: 'ACTIVO' | 'INACTIVO' }) {
    const response = await api.patch(`/usuarios/administradores/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Cambia la contraseña del usuario actualmente logueado.
   */
  async cambiarContrasena(datos: { contrasenaActual: string; nuevaContrasena: string }) {
    const response = await api.patch('/auth/cambiar-contrasena', datos);
    return response.data;
  },

  /**
   * Sube la foto de perfil del barbero autenticado.
   */
  async subirFotoBarbero(archivo: File) {
    const formData = new FormData();
    formData.append('foto', archivo);
    const response = await api.post<{ mensaje: string; fotoUrl: string }>(
      '/usuarios/barberos/foto',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Elimina la foto de perfil del barbero autenticado.
   */
  async eliminarFotoBarbero() {
    const response = await api.delete<{ mensaje: string; fotoUrl: null }>(
      '/usuarios/barberos/foto',
    );
    return response.data;
  },
};
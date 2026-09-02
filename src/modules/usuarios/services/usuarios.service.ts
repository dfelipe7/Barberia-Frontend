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
  } | null;
  barbero?: {
    id: number;
    usuarioId: number;
    telefono: string;
    porcentajeComision: number;
    estado: 'ACTIVO' | 'INACTIVO';
  } | null;
}

export interface BarberoCatalogo {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
}

export interface AdministradorGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface BarberoGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  porcentajeComision: number;
  estado: 'ACTIVO' | 'INACTIVO';
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
}

export interface ActualizarComision {
  porcentajeComision: number;
}

export interface CambiarEstado {
  estado: 'ACTIVO' | 'INACTIVO';
}

export const usuariosService = {
  async obtenerUsuario(id: number) {
    const response = await api.get<Usuario>(
      `/usuarios/${id}`,
    );

    return response.data;
  },

  async obtenerBarberos() {
    const response = await api.get<BarberoCatalogo[]>(
      '/usuarios/barberos',
    );

    return response.data;
  },


async obtenerAdministradores() {
  const response =
    await api.get<AdministradorGestion[]>(
      '/usuarios/administradores',
    );

  return response.data;
},

async obtenerBarberosGestion() {
  const response =
    await api.get<BarberoGestion[]>(
      '/usuarios/barberos/gestion',
    );

  return response.data;
},



  async crearAdministrador(
    datos: CrearAdministrador,
  ) {
    const response = await api.post(
      '/usuarios/administradores',
      datos,
    );

    return response.data;
  },

  async crearBarbero(datos: CrearBarbero) {
    const response = await api.post(
      '/usuarios/barberos',
      datos,
    );

    return response.data;
  },

  async actualizarUsuario(
    id: number,
    datos: ActualizarUsuario,
  ) {
    const response = await api.patch<Usuario>(
      `/usuarios/${id}`,
      datos,
    );

    return response.data;
  },

  async cambiarEstado(
    id: number,
    datos: CambiarEstado,
  ) {
    const response = await api.patch(
      `/usuarios/${id}/estado`,
      datos,
    );

    return response.data;
  },

  async actualizarComision(
    id: number,
    datos: ActualizarComision,
  ) {
    const response = await api.patch(
      `/usuarios/${id}/comision`,
      datos,
    );

    return response.data;
  },
};
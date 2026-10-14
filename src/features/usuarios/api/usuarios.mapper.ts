import type {
  UsuarioDTO,
  AdministradorGestionDTO,
  CrearAdministradorDTO,
  ActualizarUsuarioDTO,
} from './usuarios.dto';
import type {
  Usuario,
  AdministradorGestion,
  UsuarioDetalle,
} from '../types/usuarios.types';
import type { BarberoGestion } from '../../barberos/types/barberos.types';

/**
 * PATRÓN ADAPTER / MAPPER:
 * Traduce entre las estructuras crudas del backend (DTOs) y las entidades
 * de dominio limpias consumidas por la capa de UI.
 */
export const usuariosMapper = {
  toDomain(dto: UsuarioDTO): Usuario {
    return {
      id: dto.id,
      googleId: dto.googleId,
      email: dto.email,
      nombre: dto.nombre,
      apellido: dto.apellido,
      rol: dto.rol,
      estado: dto.estado,
      administrador: dto.administrador
        ? {
            id: dto.administrador.id,
            usuarioId: dto.administrador.usuarioId,
            estado: dto.administrador.estado,
          }
        : null,
      barbero: dto.barbero
        ? {
            id: dto.barbero.id,
            usuarioId: dto.barbero.usuarioId,
            telefono: dto.barbero.telefono,
            porcentajeComision: Number(dto.barbero.porcentajeComision) || 0,
            estado: dto.barbero.estado,
            fotoUrl: dto.barbero.fotoUrl ?? null,
          }
        : null,
    };
  },

  toAdminGestionDomain(dto: AdministradorGestionDTO): AdministradorGestion {
    return {
      id: dto.id,
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      estado: dto.estado,
      estadoAdmin: dto.estadoAdmin,
      esBarbero: Boolean(dto.esBarbero),
      estadoBarbero: dto.estadoBarbero,
    };
  },

  toDetalleDomain(
    entity: AdministradorGestion | BarberoGestion | Usuario
  ): UsuarioDetalle {
    let tipoPerfil: UsuarioDetalle['tipoPerfil'] = 'Administrador';
    let telefono: string | undefined;
    let porcentajeComision: number | undefined;

    if ('rol' in entity) {
      // Usuario completo
      if (entity.administrador && entity.barbero) {
        tipoPerfil = 'Administrador / Barbero';
      } else if (entity.barbero) {
        tipoPerfil = 'Barbero';
      }
      telefono = entity.barbero?.telefono;
      porcentajeComision = entity.barbero?.porcentajeComision;
    } else if ('porcentajeComision' in entity) {
      // BarberoGestion
      tipoPerfil = entity.esAdministrador ? 'Administrador / Barbero' : 'Barbero';
      telefono = entity.telefono;
      porcentajeComision = entity.porcentajeComision;
    } else {
      // AdministradorGestion
      tipoPerfil = entity.esBarbero ? 'Administrador / Barbero' : 'Administrador';
    }

    return {
      id: entity.id,
      nombre: entity.nombre,
      apellido: entity.apellido,
      email: entity.email,
      estado: entity.estado,
      telefono,
      porcentajeComision,
      tipoPerfil,
    };
  },

  toCrearAdminDTO(values: {
    nombre: string;
    apellido?: string;
    email: string;
  }): CrearAdministradorDTO {
    return {
      nombre: values.nombre.trim(),
      apellido: values.apellido?.trim() || '',
      email: values.email.trim().toLowerCase(),
    };
  },

  toActualizarUsuarioDTO(values: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    porcentajeComision?: number;
    esAdministrador?: boolean;
    esBarbero?: boolean;
  }): ActualizarUsuarioDTO {
    return {
      ...(values.nombre !== undefined && { nombre: values.nombre.trim() }),
      ...(values.apellido !== undefined && { apellido: values.apellido.trim() }),
      ...(values.email !== undefined && { email: values.email.trim().toLowerCase() }),
      ...(values.telefono !== undefined && { telefono: values.telefono.trim() }),
      ...(values.porcentajeComision !== undefined && {
        porcentajeComision: Number(values.porcentajeComision),
      }),
      ...(values.esAdministrador !== undefined && {
        esAdministrador: values.esAdministrador,
      }),
      ...(values.esBarbero !== undefined && { esBarbero: values.esBarbero }),
    };
  },
};

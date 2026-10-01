import type {
  ServicioDTO,
  CrearServicioDTO,
  ActualizarServicioDTO,
  FiltroServiciosDTO,
} from './servicios.dto';
import type { Servicio, FiltroServicios, EstadoEntidad } from '../types/servicios.types';

export const serviciosMapper = {
  toDomain(dto: ServicioDTO): Servicio {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      precio: Number(dto.precio),
      duracionMinutos: Number(dto.duracionMinutos),
      fotoUrl: dto.fotoUrl ?? null,
      estado: dto.estado as EstadoEntidad,
      barberos: dto.barberos.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        apellido: b.apellido,
        fotoUrl: b.fotoUrl ?? null,
      })),
    };
  },

  toCrearDTO(datos: {
    nombre: string;
    descripcion?: string;
    precio: number;
    duracionMinutos: number;
    barberoIds?: number[];
  }): CrearServicioDTO {
    return {
      nombre: datos.nombre.trim(),
      ...(datos.descripcion && { descripcion: datos.descripcion.trim() }),
      precio: datos.precio,
      duracionMinutos: datos.duracionMinutos,
      ...(datos.barberoIds && { barberoIds: datos.barberoIds }),
    };
  },

  toActualizarDTO(datos: {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracionMinutos?: number;
    barberoIds?: number[];
  }): ActualizarServicioDTO {
    return {
      ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
      ...(datos.descripcion !== undefined && { descripcion: datos.descripcion.trim() }),
      ...(datos.precio !== undefined && { precio: datos.precio }),
      ...(datos.duracionMinutos !== undefined && { duracionMinutos: datos.duracionMinutos }),
      ...(datos.barberoIds !== undefined && { barberoIds: datos.barberoIds }),
    };
  },

  toFiltroDTO(filtro?: FiltroServicios): FiltroServiciosDTO | undefined {
    if (!filtro) return undefined;
    return {
      ...(filtro.nombre && { nombre: filtro.nombre }),
      ...(filtro.estado && { estado: filtro.estado }),
    };
  },
};

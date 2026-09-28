import type { ServicioDTO, CrearServicioDTO } from './servicios.dto';
import type { Servicio } from '../types/servicios.types';

export const serviciosMapper = {
  toDomain(dto: ServicioDTO): Servicio {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio: Number(dto.precio),
      duracionMinutos: Number(dto.duracionMinutos),
      activo: Boolean(dto.activo),
      categoria: dto.categoria,
      imagenUrl: dto.imagenUrl ?? undefined,
    };
  },

  toCrearDTO(domain: Omit<Servicio, 'id' | 'activo'>): CrearServicioDTO {
    return {
      nombre: domain.nombre.trim(),
      descripcion: domain.descripcion.trim(),
      precio: domain.precio,
      duracionMinutos: domain.duracionMinutos,
      categoria: domain.categoria?.trim(),
      imagenUrl: domain.imagenUrl ?? undefined,
    };
  },
};

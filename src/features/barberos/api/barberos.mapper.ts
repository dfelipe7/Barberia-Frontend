import type {
  BarberoCatalogoDTO,
  BarberoGestionDTO,
  CrearBarberoDTO,
} from './barberos.dto';
import type {
  BarberoCatalogo,
  BarberoGestion,
} from '../types/barberos.types';

export const barberosMapper = {
  toCatalogoDomain(dto: BarberoCatalogoDTO): BarberoCatalogo {
    return {
      id: dto.id,
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
    };
  },

  toGestionDomain(dto: BarberoGestionDTO): BarberoGestion {
    return {
      id: dto.id,
      nombre: dto.nombre,
      apellido: dto.apellido,
      email: dto.email,
      telefono: dto.telefono,
      porcentajeComision: Number(dto.porcentajeComision) || 0,
      estado: dto.estado,
      estadoAdmin: dto.estadoAdmin,
      estadoGlobal: dto.estadoGlobal,
      esAdministrador: Boolean(dto.esAdministrador),
    };
  },

  toCrearDTO(values: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    password: string;
    porcentajeComision: number;
  }): CrearBarberoDTO {
    return {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      email: values.email.trim().toLowerCase(),
      telefono: values.telefono.trim(),
      password: values.password,
      porcentajeComision: values.porcentajeComision,
    };
  },
};

import type { FiltroServicios } from '../types/servicios.types';

export const serviciosKeys = {
  all: ['servicios'] as const,
  catalogo: (filtro?: FiltroServicios) =>
    [...serviciosKeys.all, 'catalogo', filtro ?? {}] as const,
  gestion: (filtro?: FiltroServicios) =>
    [...serviciosKeys.all, 'gestion', filtro ?? {}] as const,
  detail: (id: number | string) => [...serviciosKeys.all, 'detail', Number(id)] as const,
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosService } from './servicios.service';
import { serviciosMapper } from './servicios.mapper';
import { serviciosKeys } from './servicios.keys';
import type { Servicio, FiltroServicios } from '../types/servicios.types';
import type { CambiarEstadoServicioDTO } from './servicios.dto';

/**
 * Hook de consulta React Query para la gestión administrativa de servicios de la barbería.
 *
 * @param filtro - Criterios opcionales de búsqueda o categoría.
 * @returns Objeto `useQuery` con los servicios mapeados al modelo de dominio.
 */
export function useServiciosGestion(filtro?: FiltroServicios) {
  return useQuery<Servicio[], Error>({
    queryKey: serviciosKeys.gestion(filtro),
    queryFn: async () => {
      const dtos = await serviciosService.obtenerServiciosGestion(
        serviciosMapper.toFiltroDTO(filtro)
      );
      return dtos.map(serviciosMapper.toDomain);
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Hook de mutación React Query para dar de alta un nuevo servicio.
 */
export function useCrearServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Parameters<typeof serviciosMapper.toCrearDTO>[0]) =>
      serviciosService.crearServicio(serviciosMapper.toCrearDTO(datos)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para modificar datos comerciales de un servicio existente.
 */
export function useActualizarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number;
      datos: Parameters<typeof serviciosMapper.toActualizarDTO>[0];
    }) => serviciosService.actualizarServicio(id, serviciosMapper.toActualizarDTO(datos)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para cambiar el estado de activación de un servicio.
 */
export function useCambiarEstadoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoServicioDTO }) =>
      serviciosService.cambiarEstadoServicio(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para subir la fotografía ilustrativa de un servicio.
 */
export function useSubirFotoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      serviciosService.subirFotoServicio(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para retirar la imagen de un servicio.
 */
export function useEliminarFotoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviciosService.eliminarFotoServicio(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook de consulta React Query para el catálogo público de servicios.
 *
 * @param filtro - Filtro opcional por texto o categoría.
 * @returns Lista de servicios disponibles al público.
 */
export function useServiciosCatalogo(filtro?: FiltroServicios) {
  return useQuery<Servicio[], Error>({
    queryKey: serviciosKeys.catalogo(filtro),
    queryFn: async () => {
      const dtos = await serviciosService.obtenerServiciosCatalogo(
        serviciosMapper.toFiltroDTO(filtro)
      );
      return dtos.map(serviciosMapper.toDomain);
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Hook de consulta React Query para obtener los servicios asignados a un barbero en específico.
 *
 * @param barberoId - Identificador del barbero.
 * @returns Lista de servicios capacitados para el barbero.
 */
export function useServiciosPorBarbero(barberoId: number | null | undefined) {
  return useQuery<Servicio[], Error>({
    queryKey: serviciosKeys.porBarbero(barberoId ?? 0),
    queryFn: async () => {
      if (!barberoId) return [];
      const dtos = await serviciosService.obtenerServiciosPorBarbero(barberoId);
      return dtos.map(serviciosMapper.toDomain);
    },
    enabled: Boolean(barberoId),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

/**
 * Valida si un servicio se encuentra en estado ACTIVO y tiene barberos vinculados.
 */
export function esServicioActivoConBarberos(s: {
  estado: string;
  barberos?: readonly unknown[];
}): boolean {
  return s.estado === 'ACTIVO' && Array.isArray(s.barberos) && s.barberos.length > 0;
}


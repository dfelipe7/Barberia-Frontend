import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosService } from './servicios.service';
import { serviciosMapper } from './servicios.mapper';
import { serviciosKeys } from './servicios.keys';
import type { Servicio, FiltroServicios } from '../types/servicios.types';
import type { CambiarEstadoServicioDTO } from './servicios.dto';

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

export function useCrearServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Parameters<typeof serviciosMapper.toCrearDTO>[0]) =>
      serviciosService.crearServicio(serviciosMapper.toCrearDTO(datos)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

export function useCambiarEstadoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoServicioDTO }) =>
      serviciosService.cambiarEstadoServicio(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

export function useSubirFotoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      serviciosService.subirFotoServicio(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

export function useEliminarFotoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviciosService.eliminarFotoServicio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

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

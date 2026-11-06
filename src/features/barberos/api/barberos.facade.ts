import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barberosService } from './barberos.service';
import { barberosMapper } from './barberos.mapper';
import { barberosKeys } from './barberos.keys';
import type {
  CrearBarberoDTO,
  ActualizarComisionDTO,
  CambiarEstadoBarberoDTO,
} from './barberos.dto';
import type { BarberoCatalogo, BarberoGestion } from '../types/barberos.types';

export function useBarberosCatalogo(enabled = true) {
  return useQuery<BarberoCatalogo[], Error>({
    queryKey: barberosKeys.catalogo(),
    queryFn: async () => {
      const dtos = await barberosService.obtenerBarberos();
      return dtos.map(barberosMapper.toCatalogoDomain);
    },
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useBarberosGestion(
  filtroOrEnabled?: { estado?: 'ACTIVO' | 'INACTIVO'; nombre?: string } | boolean,
  enabledArg = true,
) {
  const filtro = typeof filtroOrEnabled === 'object' ? filtroOrEnabled : undefined;
  const enabled = typeof filtroOrEnabled === 'boolean' ? filtroOrEnabled : enabledArg;

  return useQuery<BarberoGestion[], Error>({
    queryKey: barberosKeys.gestion(filtro),
    queryFn: async () => {
      const dtos = await barberosService.obtenerBarberosGestion(filtro);
      return dtos.map(barberosMapper.toGestionDomain);
    },
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCrearBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearBarberoDTO) => barberosService.crearBarbero(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useCambiarEstadoBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoBarberoDTO }) =>
      barberosService.cambiarEstadoBarbero(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useCambiarEstadoGlobalBarbero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      datos,
      tipo = 'barbero',
    }: {
      id: number;
      datos: CambiarEstadoBarberoDTO;
      tipo?: 'barbero' | 'ambos';
    }) => barberosService.cambiarEstadoGlobalBarbero(id, datos, tipo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      void queryClient.invalidateQueries({ queryKey: ['administradores'] });
    },
  });
}

export function useActualizarComision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarComisionDTO }) =>
      barberosService.actualizarComision(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useSubirFotoPropia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => barberosService.subirFotoPropia(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useEliminarFotoPropia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => barberosService.eliminarFotoPropia(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useSubirFotoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      barberosService.subirFotoAdmin(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
      void queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
    },
  });
}

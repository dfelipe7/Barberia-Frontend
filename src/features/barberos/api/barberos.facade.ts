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
  });
}

export function useBarberosGestion(enabled = true) {
  return useQuery<BarberoGestion[], Error>({
    queryKey: barberosKeys.gestion(),
    queryFn: async () => {
      const dtos = await barberosService.obtenerBarberosGestion();
      return dtos.map(barberosMapper.toGestionDomain);
    },
    enabled,
  });
}

export function useCrearBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearBarberoDTO) => barberosService.crearBarbero(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useCambiarEstadoBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoBarberoDTO }) =>
      barberosService.cambiarEstadoBarbero(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barberosKeys.catalogo() });
      queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

export function useActualizarComision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarComisionDTO }) =>
      barberosService.actualizarComision(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: barberosKeys.gestion() });
    },
  });
}

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

/**
 * Hook de consulta React Query para el catálogo público de barberos.
 *
 * @param enabled - Bandera booleana para condicionar la ejecución de la consulta.
 * @returns Objeto `useQuery` con los barberos mapeados al modelo de dominio.
 */
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

/**
 * Hook de consulta React Query para la grilla administrativa de barberos de la sede.
 *
 * @param filtroOrEnabled - Filtros de búsqueda (estado, nombre) o indicador booleano de habilitación.
 * @param enabledArg - Parámetro secundario para habilitar la consulta si el primer argumento es un filtro.
 * @returns Objeto `useQuery` con los barberos para gestión interna.
 */
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

/**
 * Hook de mutación React Query para registrar y vincular un nuevo barbero a la sede.
 */
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

/**
 * Hook de mutación React Query para cambiar el estado operativo (`ACTIVO`/`INACTIVO`) de un barbero.
 */
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

/**
 * Hook de mutación React Query para cambiar el estado global de la cuenta del barbero en la plataforma.
 */
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

/**
 * Hook de mutación React Query para actualizar la comisión porcentual de un barbero.
 */
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

/**
 * Hook de mutación React Query para que el barbero autenticado actualice su foto de perfil.
 */
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

/**
 * Hook de mutación React Query para que el barbero autenticado elimine su foto de perfil.
 */
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

/**
 * Hook de mutación React Query para que un administrador suba o reemplace la foto de cualquier barbero.
 */
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

/**
 * Filtro de catálogo: selecciona los barberos que tienen al menos un servicio activo asignado.
 */
export function filtrarBarberosConServiciosActivos<
  B extends { id: number },
  S extends { estado: string; barberos?: Array<{ id: number }> }
>(barberos: readonly B[], servicios: readonly S[]): B[] {
  const idsValidos = new Set<number>();
  servicios.forEach((s) => {
    if (s.estado === 'ACTIVO' && Array.isArray(s.barberos)) {
      s.barberos.forEach((b) => idsValidos.add(b.id));
    }
  });
  return barberos.filter((b) => idsValidos.has(b.id));
}

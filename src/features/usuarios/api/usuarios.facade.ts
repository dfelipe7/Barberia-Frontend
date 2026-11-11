import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosService } from './usuarios.service';
import { usuariosMapper } from './usuarios.mapper';
import { usuariosKeys } from './usuarios.keys';
import type {
  CrearAdministradorDTO,
  ActualizarUsuarioDTO,
  CambiarEstadoDTO,
  CambiarEstadoUsuarioDTO,
  ConfigurarBarberoDTO,
} from './usuarios.dto';
import type { AdministradorGestion, Usuario } from '../types/usuarios.types';

/**
 * PATRÓN FACADE:
 * Oculta la complejidad de Axios, TanStack Query y Mappers.
 * La capa de presentación (components y pages) SOLO consume estos custom hooks.
 */

/**
 * Hook de consulta React Query para obtener el listado administrativo de administradores de la barbería.
 *
 * @param enabled - Indicador booleano para habilitar la consulta.
 * @returns Lista de administradores mapeados al modelo de dominio.
 */
export function useAdministradores(enabled = true) {
  return useQuery<AdministradorGestion[], Error>({
    queryKey: usuariosKeys.administradores(),
    queryFn: async () => {
      const dtos = await usuariosService.obtenerAdministradores();
      return dtos.map(usuariosMapper.toAdminGestionDomain);
    },
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Hook de consulta React Query para obtener la ficha de detalle de un usuario.
 *
 * @param id - Identificador del usuario a consultar.
 * @returns El usuario mapeado al modelo de dominio.
 */
export function useUsuario(id: number | null | undefined) {
  return useQuery<Usuario, Error>({
    queryKey: usuariosKeys.detail(id ?? 0),
    queryFn: async () => {
      if (!id) throw new Error('ID de usuario inválido');
      const dto = await usuariosService.obtenerUsuario(id);
      return usuariosMapper.toDomain(dto);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook de mutación React Query para registrar y vincular un nuevo administrador a la barbería.
 */
export function useCrearAdministrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearAdministradorDTO) => usuariosService.crearAdministrador(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
    },
  });
}

/**
 * Hook de mutación React Query para actualizar datos básicos de un usuario.
 */
export function useActualizarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarUsuarioDTO }) =>
      usuariosService.actualizarUsuario(id, datos),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.perfil() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

/**
 * Hook de mutación React Query para cambiar el estado global de una cuenta de usuario.
 */
export function useCambiarEstadoUsuarioGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoUsuarioDTO }) =>
      usuariosService.cambiarEstadoUsuario(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

/**
 * Hook de mutación React Query para cambiar el estado de acceso de un usuario.
 */
export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoDTO }) =>
      usuariosService.cambiarEstado(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

/**
 * Hook de mutación React Query para cambiar el estado del rol de administrador en la sede.
 */
export function useCambiarEstadoAdministrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEstadoDTO }) =>
      usuariosService.cambiarEstadoAdministrador(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

/**
 * Hook de mutación React Query para asignar o modificar el perfil de barbero a un usuario.
 */
export function useConfigurarBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ConfigurarBarberoDTO }) =>
      usuariosService.configurarBarbero(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

/**
 * Hook de mutación React Query para que el usuario autenticado active su rol como barbero.
 */
export function useConfigurarMeComoBarbero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: ConfigurarBarberoDTO) =>
      usuariosService.configurarMeComoBarbero(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.perfil() });
      void queryClient.invalidateQueries({ queryKey: ['barberos'] });
    },
  });
}

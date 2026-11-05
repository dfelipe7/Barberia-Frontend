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

export function useCrearAdministrador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearAdministradorDTO) => usuariosService.crearAdministrador(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.administradores() });
    },
  });
}

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

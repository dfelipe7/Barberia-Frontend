import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarReservaDTO,
  CrearReservaDTO,
  FiltroDisponibilidadReservaDTO,
  FiltroReservasAdministrativasDTO,
} from './reservas.dto';
import { reservasKeys } from './reservas.keys';
import { reservasService } from './reservas.service';

export function useDisponibilidadReserva(filtro?: FiltroDisponibilidadReservaDTO) {
  return useQuery({
    queryKey: reservasKeys.disponibilidad(filtro),
    queryFn: () => reservasService.obtenerDisponibilidad(filtro!),
    enabled: Boolean(filtro),
  });
}

export function useMisReservas(enabled: boolean) {
  return useQuery({
    queryKey: reservasKeys.misReservas(),
    queryFn: reservasService.listarMisReservas,
    enabled,
  });
}

export function useDetalleReserva(id: number | null) {
  return useQuery({
    queryKey: reservasKeys.detalle(id),
    queryFn: () => reservasService.obtenerMiReserva(id!),
    enabled: id !== null,
  });
}

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearReservaDTO) => reservasService.crearReserva(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.all });
    },
  });
}

export function useModificarMiReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarReservaDTO }) =>
      reservasService.modificarMiReserva(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useCancelarMiReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservasService.cancelarMiReserva(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useAgendaBarbero(desde: string, hasta: string, enabled = true) {
  return useQuery({
    queryKey: reservasKeys.agendaBarbero(desde, hasta),
    queryFn: () => reservasService.obtenerAgendaSemanalBarbero(desde, hasta),
    enabled,
    staleTime: 30_000,
  });
}

export function useBuscarClientesAdministrativos(busqueda: string, enabled: boolean) {
  return useQuery({
    queryKey: reservasKeys.clientesAdministrativos(busqueda),
    queryFn: () => reservasService.buscarClientesAdministrativos(busqueda),
    enabled,
    staleTime: 30_000,
  });
}

export function useCrearReservaAdministrativa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservasService.crearReservaAdministrativa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useModificarReservaInvitado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, token, datos }: { id: number; token: string; datos: ActualizarReservaDTO }) =>
      reservasService.modificarReservaInvitado(id, token, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useCancelarReservaInvitado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, token }: { id: number; token: string }) =>
      reservasService.cancelarReservaInvitado(id, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useCompletarReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservasService.completarReserva(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useMarcarReservaNoAsistida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservasService.marcarReservaNoAsistida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export function useReservasAdministrativas(filtro: FiltroReservasAdministrativasDTO, enabled = true) {
  return useQuery({
    queryKey: reservasKeys.listadoAdministrativo(filtro),
    queryFn: () => reservasService.listarReservasAdministrativas(filtro),
    enabled,
    staleTime: 15_000,
  });
}

export function useCancelarReservaAdministrativa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservasService.cancelarReservaAdministrativa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}


export function useDetalleReservaAdministrativa(id: number | null) {
  return useQuery({
    queryKey: reservasKeys.detalleAdministrativo(id),
    queryFn: () => reservasService.obtenerReservaAdministrativa(id!),
    enabled: id !== null,
  });
}

export function useModificarReservaAdministrativa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarReservaDTO }) =>
      reservasService.modificarReservaAdministrativa(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

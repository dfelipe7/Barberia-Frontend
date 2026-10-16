import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarReservaDTO,
  CrearReservaDTO,
  FiltroDisponibilidadReservaDTO,
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

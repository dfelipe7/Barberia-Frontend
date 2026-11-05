import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { horariosKeys } from './horarios.keys';
import { horariosService } from './horarios.service';

export function useMiHorario() {
  return useQuery({
    queryKey: horariosKeys.miHorario(),
    queryFn: horariosService.obtenerMiHorario,
  });
}

export function useGuardarMiHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: horariosService.guardarMiHorario,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: horariosKeys.miHorario() });
      void queryClient.invalidateQueries({ queryKey: horariosKeys.disponibilidad() });
    },
  });
}

export function useDisponibilidadFecha(fecha: string) {
  return useQuery({
    queryKey: horariosKeys.disponibilidadFecha(fecha),
    queryFn: () => horariosService.consultarMiDisponibilidad(fecha),
    enabled: Boolean(fecha),
  });
}

export function useBloqueosHorario() {
  return useQuery({
    queryKey: horariosKeys.bloqueos(),
    queryFn: horariosService.obtenerBloqueos,
  });
}

export function useCrearBloqueoHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: horariosService.crearBloqueo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: horariosKeys.bloqueos() });
      void queryClient.invalidateQueries({ queryKey: horariosKeys.disponibilidad() });
    },
  });
}

export function useActualizarBloqueoHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof horariosService.actualizarBloqueo>[1] }) =>
      horariosService.actualizarBloqueo(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: horariosKeys.bloqueos() });
      void queryClient.invalidateQueries({ queryKey: horariosKeys.disponibilidad() });
    },
  });
}

export function useCancelarBloqueoHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: horariosService.cancelarBloqueo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: horariosKeys.bloqueos() });
      void queryClient.invalidateQueries({ queryKey: horariosKeys.disponibilidad() });
    },
  });
}

export function useReactivarBloqueoHorario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: horariosService.reactivarBloqueo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: horariosKeys.bloqueos() });
      void queryClient.invalidateQueries({ queryKey: horariosKeys.disponibilidad() });
    },
  });
}

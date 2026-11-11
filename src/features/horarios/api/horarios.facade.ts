import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { horariosKeys } from './horarios.keys';
import { horariosService } from './horarios.service';

/**
 * Hook de consulta React Query para obtener el horario laboral semanal del barbero autenticado.
 */
export function useMiHorario() {
  return useQuery({
    queryKey: horariosKeys.miHorario(),
    queryFn: horariosService.obtenerMiHorario,
  });
}

/**
 * Hook de mutación React Query para guardar o modificar el horario laboral semanal.
 */
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

/**
 * Hook de consulta React Query para conocer la disponibilidad de slots en una fecha específica.
 *
 * @param fecha - Fecha en formato `YYYY-MM-DD`.
 */
export function useDisponibilidadFecha(fecha: string) {
  return useQuery({
    queryKey: horariosKeys.disponibilidadFecha(fecha),
    queryFn: () => horariosService.consultarMiDisponibilidad(fecha),
    enabled: Boolean(fecha),
  });
}

/**
 * Hook de consulta React Query para obtener los bloqueos o excepciones de horario activos.
 */
export function useBloqueosHorario() {
  return useQuery({
    queryKey: horariosKeys.bloqueos(),
    queryFn: horariosService.obtenerBloqueos,
  });
}

/**
 * Hook de mutación React Query para crear un nuevo bloqueo de horario.
 */
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

/**
 * Hook de mutación React Query para actualizar el intervalo o motivo de un bloqueo de horario.
 */
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

/**
 * Hook de mutación React Query para cancelar un bloqueo de tiempo liberando la agenda.
 */
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

/**
 * Hook de mutación React Query para restaurar un bloqueo cancelado.
 */
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

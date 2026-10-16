import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
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

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearReservaDTO) => reservasService.crearReserva(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.all });
    },
  });
}

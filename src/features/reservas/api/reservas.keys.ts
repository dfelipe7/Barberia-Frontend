import type { FiltroDisponibilidadReservaDTO } from './reservas.dto';

export const reservasKeys = {
  all: ['reservas'] as const,
  disponibilidad: (filtro?: FiltroDisponibilidadReservaDTO) =>
    [...reservasKeys.all, 'disponibilidad', filtro ?? null] as const,
};

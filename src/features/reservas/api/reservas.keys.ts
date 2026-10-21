import type { FiltroDisponibilidadReservaDTO } from './reservas.dto';

export const reservasKeys = {
  all: ['reservas'] as const,
  disponibilidad: (filtro?: FiltroDisponibilidadReservaDTO) =>
    [...reservasKeys.all, 'disponibilidad', filtro ?? null] as const,
  barberosPorServicio: (servicioId: number) =>
    [...reservasKeys.all, 'barberos-servicio', servicioId] as const,
  misReservas: () => [...reservasKeys.all, 'mis-reservas'] as const,
  detalle: (id: number | null) => [...reservasKeys.all, 'detalle', id] as const,
  agendaBarbero: (desde: string, hasta: string) =>
    [...reservasKeys.all, 'barbero', 'agenda', desde, hasta] as const,
  clientesAdministrativos: (busqueda: string) => ['clientes', 'gestion', busqueda] as const,
  listadoAdministrativo: (filtro: unknown) => [...reservasKeys.all, 'admin', filtro] as const,
  detalleAdministrativo: (id: number | null) => [...reservasKeys.all, 'admin', 'detalle', id] as const,
};

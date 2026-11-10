import type { EstadoReservaDTO } from '../api/reservas.dto';

export const ESTADOS_RESERVA_LABELS: Record<EstadoReservaDTO, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

export const hoyISO = (fecha = new Date()): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const fechaEnNDias = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return hoyISO(fecha);
};

export const fechaEnTreintaDias = (): string => fechaEnNDias(30);

export const fechaLegible = (fecha: string): string => {
  const partes = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(partes[0], partes[1] - 1, partes[2], 12));
};

export const precioCOP = (precio: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

export const formatearDuracionMinutos = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas === 0) return `${minutosRestantes} min`;
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`;
};

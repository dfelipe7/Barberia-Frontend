import type { EstadoReservaDTO } from '../api/reservas.dto';

/**
 * Diccionario de traducción de estados técnicos de reserva a etiquetas legibles para el usuario.
 */
export const ESTADOS_RESERVA_LABELS: Record<EstadoReservaDTO, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

/**
 * Obtiene la fecha actual formateada en estándar ISO (YYYY-MM-DD).
 *
 * @param fecha - Objeto Date base opcional (por defecto la fecha y hora actual).
 * @returns Cadena de texto con la fecha en formato 'YYYY-MM-DD'.
 */
export const hoyISO = (fecha = new Date()): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Calcula una fecha futura sumando un número determinado de días a la fecha actual.
 *
 * @param dias - Cantidad de días hacia el futuro a proyectar.
 * @returns Cadena de texto con la fecha calculada en formato 'YYYY-MM-DD'.
 */
export const fechaEnNDias = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return hoyISO(fecha);
};

/**
 * Calcula la fecha límite de reserva estándar a 30 días vista desde hoy.
 *
 * @returns Cadena de texto con la fecha en formato 'YYYY-MM-DD'.
 */
export const fechaEnTreintaDias = (): string => fechaEnNDias(30);

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a una representación amigable en español (es-CO).
 *
 * @param fecha - Cadena de fecha en formato 'YYYY-MM-DD'.
 * @returns Cadena formateada para interfaz de usuario (ej. 'lun, 9 nov 2026').
 */
export const fechaLegible = (fecha: string): string => {
  const partes = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(partes[0], partes[1] - 1, partes[2], 12));
};

/**
 * Formatea un valor numérico a moneda Pesos Colombianos (COP) sin decimales.
 *
 * @param precio - Cantidad monetaria a formatear.
 * @returns Representación formateada en moneda local (ej. '$ 25.000').
 */
export const precioCOP = (precio: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

/**
 * Convierte una duración en minutos a formato legible de horas y minutos.
 *
 * @param minutos - Duración total en minutos del servicio.
 * @returns Cadena formateada (ej. '45 min', '1 h' o '1 h 30 min').
 */
export const formatearDuracionMinutos = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas === 0) return `${minutosRestantes} min`;
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`;
};

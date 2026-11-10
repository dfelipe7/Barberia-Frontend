import { describe, it, expect } from 'vitest';
import {
  ESTADOS_RESERVA_LABELS,
  hoyISO,
  fechaEnNDias,
  fechaEnTreintaDias,
  fechaLegible,
  precioCOP,
  formatearDuracionMinutos,
} from './reservaFechas';

describe('reservaFechas utilidades', () => {
  describe('ESTADOS_RESERVA_LABELS', () => {
    it('mapea correctamente todos los estados de reserva', () => {
      expect(ESTADOS_RESERVA_LABELS.PENDING).toBe('Pendiente');
      expect(ESTADOS_RESERVA_LABELS.CONFIRMED).toBe('Confirmada');
      expect(ESTADOS_RESERVA_LABELS.IN_PROGRESS).toBe('En progreso');
      expect(ESTADOS_RESERVA_LABELS.COMPLETED).toBe('Completada');
      expect(ESTADOS_RESERVA_LABELS.CANCELLED).toBe('Cancelada');
      expect(ESTADOS_RESERVA_LABELS.NO_SHOW).toBe('No asistió');
    });
  });

  describe('hoyISO', () => {
    it('formatea la fecha dada en formato YYYY-MM-DD con ceros a la izquierda', () => {
      const fecha = new Date(2026, 4, 3); // 3 de Mayo de 2026
      expect(hoyISO(fecha)).toBe('2026-05-03');
    });

    it('devuelve una fecha válida sin argumentos', () => {
      expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('fechaEnNDias y fechaEnTreintaDias', () => {
    it('calcula la fecha en N días hacia adelante', () => {
      const resultado = fechaEnNDias(5);
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('fechaEnTreintaDias devuelve una fecha válida a 30 días', () => {
      const resultado = fechaEnTreintaDias();
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('fechaLegible', () => {
    it('convierte una cadena YYYY-MM-DD en formato legible para Colombia', () => {
      const legible = fechaLegible('2026-11-09');
      expect(legible.toLowerCase()).toContain('2026');
      expect(legible.toLowerCase()).toContain('9');
    });
  });

  describe('precioCOP', () => {
    it('formatea números como moneda colombiana COP', () => {
      const formatted = precioCOP(35000);
      expect(formatted).toContain('35');
    });
  });

  describe('formatearDuracionMinutos', () => {
    it('formatea duraciones menores a una hora', () => {
      expect(formatearDuracionMinutos(45)).toBe('45 min');
    });

    it('formatea duraciones de horas exactas', () => {
      expect(formatearDuracionMinutos(60)).toBe('1 h');
      expect(formatearDuracionMinutos(120)).toBe('2 h');
    });

    it('formatea duraciones mixtas de horas y minutos', () => {
      expect(formatearDuracionMinutos(75)).toBe('1 h 15 min');
      expect(formatearDuracionMinutos(130)).toBe('2 h 10 min');
    });
  });
});

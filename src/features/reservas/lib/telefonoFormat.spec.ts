import { describe, it, expect } from 'vitest';
import {
  formatearTelefonoInput,
  normalizarTelefono,
  validarTelefono,
} from './telefonoFormat';

describe('telefonoFormat', () => {
  describe('formatearTelefonoInput', () => {
    it('formatea un número celular colombiano de 10 dígitos', () => {
      expect(formatearTelefonoInput('3001234567')).toBe('300 123 4567');
      expect(formatearTelefonoInput('3159876543')).toBe('315 987 6543');
    });

    it('formatea números parciales a medida que el usuario escribe', () => {
      expect(formatearTelefonoInput('300')).toBe('300');
      expect(formatearTelefonoInput('3001')).toBe('300 1');
      expect(formatearTelefonoInput('300123')).toBe('300 123');
      expect(formatearTelefonoInput('3001234')).toBe('300 123 4');
    });

    it('soporta números internacionales con +', () => {
      expect(formatearTelefonoInput('+573001234567')).toBe('+57 300 123 4567');
      expect(formatearTelefonoInput('+12025550123')).toBe('+12 025 5501 23');
    });

    it('ignora caracteres no numéricos excepto el +', () => {
      expect(formatearTelefonoInput('abc 300-123-4567')).toBe('300 123 4567');
    });
  });

  describe('normalizarTelefono', () => {
    it('elimina espacios para almacenamiento', () => {
      expect(normalizarTelefono('300 123 4567')).toBe('3001234567');
      expect(normalizarTelefono('+57 300 123 4567')).toBe('+573001234567');
    });
  });

  describe('validarTelefono', () => {
    it('rechaza teléfono vacío', () => {
      expect(validarTelefono('')).toEqual({
        valido: false,
        mensaje: 'El teléfono es obligatorio para agendar',
        tipo: 'incompleto',
      });
    });

    it('rechaza celular colombiano incompleto (< 10 dígitos)', () => {
      const res = validarTelefono('300 123');
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('6/10');
    });

    it('acepta celular colombiano completo de 10 dígitos', () => {
      const res = validarTelefono('300 123 4567');
      expect(res.valido).toBe(true);
      expect(res.tipo).toBe('exito');
    });

    it('acepta número internacional completo con +', () => {
      const res = validarTelefono('+57 300 123 4567');
      expect(res.valido).toBe(true);
      expect(res.tipo).toBe('exito');
    });
  });
});

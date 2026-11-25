import { describe, it, expect } from 'vitest';
import {
  formatearTelefonoInput,
  normalizarTelefono,
  validarTelefono,
} from './telefonoFormat';

describe('telefonoFormat', () => {
  describe('formatearTelefonoInput', () => {
    it('retorna cadena vacía cuando el valor es vacío o falsy', () => {
      expect(formatearTelefonoInput('')).toBe('');
      expect(formatearTelefonoInput('   ')).toBe('');
    });

    it('retorna "+" si solo se ingresa el signo más sin dígitos', () => {
      expect(formatearTelefonoInput('+')).toBe('+');
      expect(formatearTelefonoInput('+   ')).toBe('+');
    });

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

    it('formatea números locales largos de más de 10 dígitos', () => {
      expect(formatearTelefonoInput('300123456789')).toBe('300 123 4567 89');
    });

    it('formatea números con prefijo de Colombia (+57) en todas sus longitudes', () => {
      expect(formatearTelefonoInput('+57')).toBe('+57');
      expect(formatearTelefonoInput('+573')).toBe('+57 3');
      expect(formatearTelefonoInput('+57300')).toBe('+57 300');
      expect(formatearTelefonoInput('+5730012')).toBe('+57 300 12');
      expect(formatearTelefonoInput('+573001234567')).toBe('+57 300 123 4567');
    });

    it('formatea números internacionales genéricos con +', () => {
      expect(formatearTelefonoInput('+1')).toBe('+1');
      expect(formatearTelefonoInput('+12')).toBe('+12');
      expect(formatearTelefonoInput('+1234')).toBe('+12 34');
      expect(formatearTelefonoInput('+1234567')).toBe('+12 345 67');
      expect(formatearTelefonoInput('+12025550123')).toBe('+12 025 5501 23');
    });

    it('ignora caracteres no numéricos excepto el +', () => {
      expect(formatearTelefonoInput('abc 300-123-4567')).toBe('300 123 4567');
    });
  });

  describe('normalizarTelefono', () => {
    it('maneja valores vacíos', () => {
      expect(normalizarTelefono('')).toBe('');
    });

    it('elimina espacios para almacenamiento', () => {
      expect(normalizarTelefono('300 123 4567')).toBe('3001234567');
      expect(normalizarTelefono('+57 300 123 4567')).toBe('+573001234567');
    });
  });

  describe('validarTelefono', () => {
    it('rechaza teléfono vacío o solo texto', () => {
      expect(validarTelefono('')).toEqual({
        valido: false,
        mensaje: 'El teléfono es obligatorio para agendar',
        tipo: 'incompleto',
      });
      expect(validarTelefono('   ')).toEqual({
        valido: false,
        mensaje: 'El teléfono es obligatorio para agendar',
        tipo: 'incompleto',
      });
      expect(validarTelefono('abc')).toEqual({
        valido: false,
        mensaje: 'El teléfono es obligatorio para agendar',
        tipo: 'incompleto',
      });
    });

    it('rechaza teléfonos con menos de 7 dígitos', () => {
      const res = validarTelefono('12345');
      expect(res.valido).toBe(false);
      expect(res.mensaje).toBe('Faltan dígitos (5/10)');
      expect(res.tipo).toBe('incompleto');
    });

    it('rechaza celular colombiano incompleto entre 7 y 9 dígitos', () => {
      const res = validarTelefono('300 123 45');
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('8/10 dígitos');
      expect(res.tipo).toBe('incompleto');
    });

    it('acepta celular colombiano completo de 10 dígitos', () => {
      const res = validarTelefono('300 123 4567');
      expect(res.valido).toBe(true);
      expect(res.mensaje).toBe('Número de WhatsApp válido');
      expect(res.tipo).toBe('exito');
    });

    it('rechaza número internacional incompleto (7 u 8 dígitos)', () => {
      const res = validarTelefono('+57 300123');
      expect(res.valido).toBe(false);
      expect(res.mensaje).toBe('Número internacional incompleto');
      expect(res.tipo).toBe('incompleto');
    });

    it('acepta número internacional completo con +', () => {
      const res = validarTelefono('+57 300 123 4567');
      expect(res.valido).toBe(true);
      expect(res.mensaje).toBe('Número internacional válido');
      expect(res.tipo).toBe('exito');
    });

    it('acepta teléfonos fijos o generales de 7 a 15 dígitos que no empiezan por 3', () => {
      const resFijo = validarTelefono('601 234 5678');
      expect(resFijo.valido).toBe(true);
      expect(resFijo.mensaje).toBe('Número válido');
      expect(resFijo.tipo).toBe('exito');
    });

    it('rechaza números que exceden los 15 dígitos', () => {
      const resLargo = validarTelefono('1234567890123456');
      expect(resLargo.valido).toBe(false);
      expect(resLargo.mensaje).toBe('Formato de teléfono no admitido');
      expect(resLargo.tipo).toBe('invalido');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { mapApiError } from './mapApiError';

describe('mapApiError', () => {
  it('retorna mensaje amigable para 401', () => {
    const error = { response: { status: 401 } };
    expect(mapApiError(error)).toBe('Tu sesión expiró. Inicia sesión nuevamente para continuar.');
  });

  it('retorna mensaje amigable para 403', () => {
    const error = { response: { status: 403 } };
    expect(mapApiError(error)).toBe('Tu cuenta no tiene permiso para realizar esta acción.');
  });

  it('retorna mensaje amigable para 503', () => {
    const error = { response: { status: 503 } };
    expect(mapApiError(error)).toBe('Esta función no está disponible por el momento. Inténtalo de nuevo más tarde.');
  });

  it('retorna mensaje genérico de error de servidor para 500, 502, 504', () => {
    expect(mapApiError({ response: { status: 500 } })).toBe('No fue posible completar la solicitud. Inténtalo de nuevo más tarde.');
    expect(mapApiError({ response: { status: 502 } })).toBe('No fue posible completar la solicitud. Inténtalo de nuevo más tarde.');
  });

  it('usa userMessage si está normalizado y no es genérico de servidor', () => {
    const error = { userMessage: 'El teléfono ya está registrado' };
    expect(mapApiError(error)).toBe('El teléfono ya está registrado');
  });

  it('usa mensaje del backend si está en response.data', () => {
    const error = { response: { status: 400, data: { mensaje: 'Formato inválido' } } };
    expect(mapApiError(error)).toBe('Formato inválido');

    const errorArray = { response: { status: 400, data: { message: ['Error 1', 'Error 2'] } } };
    expect(mapApiError(errorArray)).toBe('Error 1 Error 2');
  });

  it('retorna mensajes por defecto para 404, 409 y 400', () => {
    expect(mapApiError({ response: { status: 404 } })).toBe('No encontramos la información solicitada.');
    expect(mapApiError({ response: { status: 409 } })).toBe('Ese horario o registro cambió y ya no está disponible. Actualiza la información e inténtalo de nuevo.');
    expect(mapApiError({ response: { status: 400 } })).toBe('Los datos ingresados no son válidos.');
  });

  it('retorna mensaje genérico para errores desconocidos', () => {
    expect(mapApiError(new Error('Network Error'))).toBe('Ocurrió un error inesperado. Intenta nuevamente.');
  });
});


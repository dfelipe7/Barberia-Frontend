import { describe, it, expect } from 'vitest';
import { obtenerUrlFoto } from './obtenerUrlFoto';

describe('obtenerUrlFoto', () => {
  it('retorna null si la URL es null o undefined', () => {
    expect(obtenerUrlFoto(null)).toBeNull();
    expect(obtenerUrlFoto(undefined)).toBeNull();
    expect(obtenerUrlFoto('')).toBeNull();
  });

  it('devuelve la URL original si ya comienza con http o https', () => {
    const url = 'https://s3.amazonaws.com/bucket/foto.jpg';
    expect(obtenerUrlFoto(url)).toBe(url);

    const httpUrl = 'http://example.com/avatar.png';
    expect(obtenerUrlFoto(httpUrl)).toBe(httpUrl);
  });

  it('concatena baseUrl para rutas relativas', () => {
    const relativa = '/uploads/fotos/barbero.jpg';
    const res = obtenerUrlFoto(relativa);
    expect(res).toContain(relativa);
  });
});


import { describe, it, expect } from 'vitest';
import { productoSchema } from '../schemas/producto.schema';

describe('productoSchema', () => {
  it('valida correctamente un producto con datos válidos', () => {
    const input = {
      nombre: 'Cera Mate',
      precio: 35000,
      descripcion: 'Fijación fuerte mate',
    };
    const resultado = productoSchema.safeParse(input);
    expect(resultado.success).toBe(true);
  });

  it('rechaza un producto con nombre demasiado corto', () => {
    const input = {
      nombre: 'A',
      precio: 35000,
    };
    const resultado = productoSchema.safeParse(input);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toContain('al menos 2 caracteres');
    }
  });

  it('rechaza un producto con precio igual o menor a cero', () => {
    const input = {
      nombre: 'Cera Mate',
      precio: 0,
    };
    const resultado = productoSchema.safeParse(input);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toContain('mayor a 0');
    }
  });

  it('rechaza una descripción mayor a 500 caracteres', () => {
    const input = {
      nombre: 'Cera Mate',
      precio: 35000,
      descripcion: 'A'.repeat(501),
    };
    const resultado = productoSchema.safeParse(input);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toContain('no puede superar los 500');
    }
  });
});


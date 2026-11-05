import { describe, it, expect } from 'vitest';
import { serviciosMapper } from './servicios.mapper';
import type { ServicioDTO } from './servicios.dto';

describe('serviciosMapper', () => {
  it('toDomain transforma ServicioDTO correctamente a Servicio', () => {
    const dto: ServicioDTO = {
      id: 10,
      nombre: 'Corte Clásico',
      descripcion: 'Corte tradicional a tijera',
      precio: 25000,
      duracionMinutos: 45,
      fotoUrl: '/uploads/corte.jpg',
      estado: 'ACTIVO',
      barberos: [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', fotoUrl: '/fotos/juan.jpg' },
      ],
    };

    const domain = serviciosMapper.toDomain(dto);
    expect(domain.id).toBe(10);
    expect(domain.nombre).toBe('Corte Clásico');
    expect(domain.precio).toBe(25000);
    expect(domain.duracionMinutos).toBe(45);
    expect(domain.barberos).toHaveLength(1);
    expect(domain.barberos[0].nombre).toBe('Juan');
  });

  it('toDomain maneja valores opcionales nulos', () => {
    const dto: ServicioDTO = {
      id: 11,
      nombre: 'Barba Express',
      descripcion: null,
      precio: 15000,
      duracionMinutos: 20,
      fotoUrl: null,
      estado: 'INACTIVO',
      barberos: [
        { id: 2, nombre: 'Pedro', apellido: 'Gómez', fotoUrl: null },
      ],
    };

    const domain = serviciosMapper.toDomain(dto);
    expect(domain.descripcion).toBeNull();
    expect(domain.fotoUrl).toBeNull();
    expect(domain.barberos[0].fotoUrl).toBeNull();
  });

  it('toCrearDTO sanea y formatea los datos de creación', () => {
    const input = {
      nombre: '  Afeitado Clásico  ',
      descripcion: '  Toallas calientes  ',
      precio: 18000,
      duracionMinutos: 30,
      barberoIds: [1, 2],
    };

    const dto = serviciosMapper.toCrearDTO(input);
    expect(dto.nombre).toBe('Afeitado Clásico');
    expect(dto.descripcion).toBe('Toallas calientes');
    expect(dto.precio).toBe(18000);
    expect(dto.duracionMinutos).toBe(30);
    expect(dto.barberoIds).toEqual([1, 2]);
  });

  it('toActualizarDTO solo incluye campos definidos', () => {
    const partial = serviciosMapper.toActualizarDTO({
      nombre: ' Nuevo Nombre ',
      precio: 30000,
    });

    expect(partial.nombre).toBe('Nuevo Nombre');
    expect(partial.precio).toBe(30000);
    expect(partial.descripcion).toBeUndefined();
    expect(partial.duracionMinutos).toBeUndefined();
    expect(partial.barberoIds).toBeUndefined();
  });

  it('toFiltroDTO retorna undefined si no se provee filtro o devuelve las claves activas', () => {
    expect(serviciosMapper.toFiltroDTO(undefined)).toBeUndefined();

    const filtro = serviciosMapper.toFiltroDTO({ nombre: 'corte', estado: 'ACTIVO' });
    expect(filtro).toEqual({ nombre: 'corte', estado: 'ACTIVO' });
  });
});


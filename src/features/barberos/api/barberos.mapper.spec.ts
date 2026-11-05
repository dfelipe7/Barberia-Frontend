import { describe, it, expect } from 'vitest';
import { barberosMapper } from './barberos.mapper';
import type { BarberoCatalogoDTO, BarberoGestionDTO } from './barberos.dto';

describe('barberosMapper', () => {
  describe('toCatalogoDomain', () => {
    it('debe mapear correctamente un DTO de catálogo a dominio', () => {
      const dto: BarberoCatalogoDTO = {
        id: 1,
        nombre: 'Carlos',
        apellido: 'Gómez',
        telefono: '3101234567',
        fotoUrl: 'https://cdn.example.com/foto.jpg',
      };

      const domain = barberosMapper.toCatalogoDomain(dto);

      expect(domain).toEqual({
        id: 1,
        nombre: 'Carlos',
        apellido: 'Gómez',
        telefono: '3101234567',
        fotoUrl: 'https://cdn.example.com/foto.jpg',
      });
    });

    it('debe asignar null si fotoUrl es undefined', () => {
      const dto: BarberoCatalogoDTO = {
        id: 2,
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '3119876543',
      };

      const domain = barberosMapper.toCatalogoDomain(dto);
      expect(domain.fotoUrl).toBeNull();
    });
  });

  describe('toGestionDomain', () => {
    it('debe transformar tipos numéricos y booleanos en gestión', () => {
      const dto: BarberoGestionDTO = {
        id: 10,
        barberoId: 5,
        nombre: 'Andrés',
        apellido: 'López',
        email: 'andres@barberia.com',
        telefono: '3201112233',
        porcentajeComision: 45,
        estado: 'ACTIVO',
        estadoAdmin: 'ACTIVO',
        estadoGlobal: 'ACTIVO',
        esAdministrador: true,
      };

      const domain = barberosMapper.toGestionDomain(dto);

      expect(domain.porcentajeComision).toBe(45);
      expect(domain.esAdministrador).toBe(true);
      expect(domain.fotoUrl).toBeNull();
    });
  });

  describe('toCrearDTO', () => {
    it('debe sanitizar con trim y pasar a minúsculas el email', () => {
      const input = {
        nombre: '  Mateo  ',
        apellido: '  Ríos ',
        email: '  MATEO@GMAIL.COM  ',
        telefono: ' 3159998877 ',
        porcentajeComision: 40,
      };

      const dto = barberosMapper.toCrearDTO(input);

      expect(dto.nombre).toBe('Mateo');
      expect(dto.apellido).toBe('Ríos');
      expect(dto.email).toBe('mateo@gmail.com');
      expect(dto.telefono).toBe('3159998877');
    });
  });
});


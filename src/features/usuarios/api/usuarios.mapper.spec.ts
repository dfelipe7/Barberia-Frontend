import { describe, it, expect } from 'vitest';
import { usuariosMapper } from './usuarios.mapper';
import type { UsuarioDTO, AdministradorGestionDTO } from './usuarios.dto';
import type { Usuario, AdministradorGestion } from '../types/usuarios.types';
import type { BarberoGestion } from '../../barberos/types/barberos.types';

describe('usuariosMapper', () => {
  describe('toDomain', () => {
    it('debe mapear un usuario completo con relaciones de administrador y barbero', () => {
      const dto: UsuarioDTO = {
        id: 1,
        email: 'admin@barberia.com',
        nombre: 'Admin',
        apellido: 'General',
        rol: 'ADMINISTRADOR',
        estado: 'ACTIVO',
        administrador: {
          id: 10,
          usuarioId: 1,
          estado: 'ACTIVO',
        },
        barbero: {
          id: 20,
          usuarioId: 1,
          telefono: '3123456789',
          porcentajeComision: 50,
          estado: 'ACTIVO',
        },
      };

      const domain = usuariosMapper.toDomain(dto);

      expect(domain.id).toBe(1);
      expect(domain.administrador?.id).toBe(10);
      expect(domain.barbero?.porcentajeComision).toBe(50);
      expect(domain.barbero?.fotoUrl).toBeNull();
    });

    it('debe soportar relaciones nulas para barbero y administrador', () => {
      const dto: UsuarioDTO = {
        id: 2,
        email: 'cliente@barberia.com',
        nombre: 'Cliente',
        apellido: 'Fiel',
        rol: 'BARBERO',
        estado: 'INACTIVO',
      };

      const domain = usuariosMapper.toDomain(dto);
      expect(domain.administrador).toBeNull();
      expect(domain.barbero).toBeNull();
    });
  });

  describe('toAdminGestionDomain', () => {
    it('debe mapear un administrador de gestión con esBarbero según corresponda', () => {
      const dto: AdministradorGestionDTO = {
        id: 5,
        nombre: 'Socio',
        apellido: 'Principal',
        email: 'socio@barberia.com',
        estado: 'ACTIVO',
        estadoAdmin: 'ACTIVO',
        esBarbero: true,
      };

      const domain = usuariosMapper.toAdminGestionDomain(dto);
      expect(domain.id).toBe(5);
      expect(domain.esBarbero).toBe(true);
    });
  });

  describe('toDetalleDomain', () => {
    it('mapea entidad Usuario con administrador y barbero', () => {
      const user: Usuario = {
        id: 1,
        nombre: 'Doble',
        apellido: 'Rol',
        email: 'doble@test.com',
        rol: 'ADMINISTRADOR',
        estado: 'ACTIVO',
        administrador: { id: 1, usuarioId: 1, estado: 'ACTIVO' },
        barbero: { id: 2, usuarioId: 1, telefono: '12345', porcentajeComision: 40, estado: 'ACTIVO', fotoUrl: null },
      };

      const detalle = usuariosMapper.toDetalleDomain(user);
      expect(detalle.tipoPerfil).toBe('Administrador / Barbero');
      expect(detalle.telefono).toBe('12345');
      expect(detalle.porcentajeComision).toBe(40);
    });

    it('mapea entidad Usuario solo barbero', () => {
      const user: Usuario = {
        id: 2,
        nombre: 'Solo',
        apellido: 'Barbero',
        email: 'barbero@test.com',
        rol: 'BARBERO',
        estado: 'ACTIVO',
        administrador: null,
        barbero: { id: 3, usuarioId: 2, telefono: '54321', porcentajeComision: 50, estado: 'ACTIVO', fotoUrl: null },
      };

      const detalle = usuariosMapper.toDetalleDomain(user);
      expect(detalle.tipoPerfil).toBe('Barbero');
    });

    it('mapea BarberoGestion', () => {
      const bg: BarberoGestion = {
        id: 3,
        nombre: 'Gestion',
        apellido: 'Barbero',
        email: 'bg@test.com',
        estado: 'ACTIVO',
        estadoGlobal: 'ACTIVO',
        telefono: '999',
        porcentajeComision: 30,
        esAdministrador: true,
      };

      const detalle = usuariosMapper.toDetalleDomain(bg);
      expect(detalle.tipoPerfil).toBe('Administrador / Barbero');
      expect(detalle.porcentajeComision).toBe(30);
    });

    it('mapea AdministradorGestion', () => {
      const ag: AdministradorGestion = {
        id: 4,
        nombre: 'Admin',
        apellido: 'Gestion',
        email: 'ag@test.com',
        estado: 'ACTIVO',
        estadoAdmin: 'ACTIVO',
        esBarbero: false,
      };

      const detalle = usuariosMapper.toDetalleDomain(ag);
      expect(detalle.tipoPerfil).toBe('Administrador');
    });
  });

  describe('toCrearAdminDTO y toActualizarUsuarioDTO', () => {
    it('toCrearAdminDTO recorta espacios y pasa email a minúsculas', () => {
      const dto = usuariosMapper.toCrearAdminDTO({
        nombre: '  Ana  ',
        apellido: '  Lopez  ',
        email: '  ANA@EXAMPLE.COM  ',
      });

      expect(dto.nombre).toBe('Ana');
      expect(dto.apellido).toBe('Lopez');
      expect(dto.email).toBe('ana@example.com');
    });

    it('toActualizarUsuarioDTO formatea campos definidos', () => {
      const dto = usuariosMapper.toActualizarUsuarioDTO({
        nombre: ' Pedro ',
        porcentajeComision: 45,
        esAdministrador: true,
      });

      expect(dto.nombre).toBe('Pedro');
      expect(dto.porcentajeComision).toBe(45);
      expect(dto.esAdministrador).toBe(true);
    });
  });
});

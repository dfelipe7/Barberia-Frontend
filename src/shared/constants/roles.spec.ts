import { describe, it, expect } from 'vitest';
import { esRolApp, ROLES_APP, ROL_COLORS, ROL_HIERARCHY } from './roles';
import * as AutorizacionRoles from '../lib/autorizacion/roles';

describe('Constantes y utilidades de Roles (roles.ts)', () => {
  it('debe re-exportar correctamente desde autorizacion/roles', () => {
    expect(AutorizacionRoles.ROLES_APP).toEqual(ROLES_APP);
  });
  it('debe contener los tres roles autorizados de la aplicación', () => {
    expect(ROLES_APP).toEqual(['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO']);
  });

  describe('esRolApp (Type Guard)', () => {
    it('debe retornar true para roles válidos', () => {
      expect(esRolApp('SUPERADMIN')).toBe(true);
      expect(esRolApp('ADMINISTRADOR')).toBe(true);
      expect(esRolApp('BARBERO')).toBe(true);
    });

    it('debe retornar false para roles inválidos o strings vacíos', () => {
      expect(esRolApp('CLIENTE')).toBe(false);
      expect(esRolApp('USER')).toBe(false);
      expect(esRolApp('')).toBe(false);
      expect(esRolApp('superadmin')).toBe(false);
    });
  });

  describe('ROL_COLORS', () => {
    it('debe mapear cada rol a su clase contextual de Bootstrap', () => {
      expect(ROL_COLORS.SUPERADMIN).toBe('danger');
      expect(ROL_COLORS.ADMINISTRADOR).toBe('warning');
      expect(ROL_COLORS.BARBERO).toBe('info');
    });
  });

  describe('ROL_HIERARCHY', () => {
    it('debe asignar la jerarquía correcta en orden descendente', () => {
      expect(ROL_HIERARCHY.SUPERADMIN).toBeGreaterThan(ROL_HIERARCHY.ADMINISTRADOR);
      expect(ROL_HIERARCHY.ADMINISTRADOR).toBeGreaterThan(ROL_HIERARCHY.BARBERO);
    });
  });
});


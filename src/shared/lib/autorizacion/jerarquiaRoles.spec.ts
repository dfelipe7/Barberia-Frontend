import { describe, it, expect } from 'vitest';
import { puedeGestionarEstado } from './jerarquiaRoles';

describe('puedeGestionarEstado', () => {
  it('SUPERADMIN puede gestionar ADMINISTRADOR y BARBERO', () => {
    expect(puedeGestionarEstado('SUPERADMIN', 'ADMINISTRADOR')).toBe(true);
    expect(puedeGestionarEstado('SUPERADMIN', 'BARBERO')).toBe(true);
    expect(puedeGestionarEstado('SUPERADMIN', 'SUPERADMIN')).toBe(false);
  });

  it('ADMINISTRADOR puede gestionar BARBERO pero no a otro ADMINISTRADOR ni SUPERADMIN', () => {
    expect(puedeGestionarEstado('ADMINISTRADOR', 'BARBERO')).toBe(true);
    expect(puedeGestionarEstado('ADMINISTRADOR', 'ADMINISTRADOR')).toBe(false);
    expect(puedeGestionarEstado('ADMINISTRADOR', 'SUPERADMIN')).toBe(false);
  });

  it('BARBERO no puede gestionar ningún rol', () => {
    expect(puedeGestionarEstado('BARBERO', 'BARBERO')).toBe(false);
    expect(puedeGestionarEstado('BARBERO', 'ADMINISTRADOR')).toBe(false);
  });
});

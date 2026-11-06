import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEMAS_TENANT,
  resolverTemaTenant,
  guardarTemaTenant,
  type TenantThemeId,
} from './tenantTheme';

describe('Configuración de Temas Multitenant (tenantTheme.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tenant-theme');
  });

  describe('TEMAS_TENANT', () => {
    it('debe registrar los 6 temas oficiales del sistema', () => {
      const temasDisponibles: TenantThemeId[] = [
        'clasico-azul',
        'cyber-lime',
        'sunset-amber',
        'midnight-cyan',
        'crimson-velvet',
        'monochrome-noir',
      ];

      temasDisponibles.forEach((id) => {
        expect(TEMAS_TENANT[id]).toBeDefined();
        expect(TEMAS_TENANT[id].id).toBe(id);
        expect(TEMAS_TENANT[id].colorPrimario).toBeTruthy();
      });
    });
  });

  describe('resolverTemaTenant', () => {
    it('debe retornar "clasico-azul" por defecto si slug es nulo o indefinido', () => {
      expect(resolverTemaTenant(null)).toBe('clasico-azul');
      expect(resolverTemaTenant(undefined)).toBe('clasico-azul');
      expect(resolverTemaTenant('')).toBe('clasico-azul');
    });

    it('debe priorizar el tema guardado en localStorage para la sede', () => {
      localStorage.setItem('tema_negocio_sede-norte', 'monochrome-noir');
      expect(resolverTemaTenant('sede-norte')).toBe('monochrome-noir');
    });

    it('debe resolver "cyber-lime" si el slug contiene "demo-2" y no hay preferencia guardada', () => {
      expect(resolverTemaTenant('barberia-demo-2')).toBe('cyber-lime');
    });

    it('debe retornar "clasico-azul" como fallback para cualquier otra sede sin preferencia', () => {
      expect(resolverTemaTenant('sede-centro')).toBe('clasico-azul');
    });
  });

  describe('guardarTemaTenant', () => {
    it('debe almacenar en localStorage y actualizar el atributo data-tenant-theme del documento', () => {
      guardarTemaTenant('mi-barberia', 'crimson-velvet');

      expect(localStorage.getItem('tema_negocio_mi-barberia')).toBe('crimson-velvet');
      expect(document.documentElement.getAttribute('data-tenant-theme')).toBe('crimson-velvet');
    });

    it('no debe realizar ninguna acción si el slug está vacío', () => {
      guardarTemaTenant('', 'sunset-amber');
      expect(document.documentElement.getAttribute('data-tenant-theme')).toBeNull();
    });
  });
});


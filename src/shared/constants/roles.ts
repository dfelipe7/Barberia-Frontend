/**
 * Catálogo centralizado y tipado estricto del Modelo de Control de Acceso (RBAC).
 * Define la lista canónica de roles del sistema, colores distintivos para la UI
 * y la jerarquía de privilegios de gestión.
 */

/**
 * Roles autorizados en el sistema para miembros del personal.
 */
export const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'] as const;

/**
 * Tipo literal que agrupa los roles válidos del personal.
 */
export type Rol = (typeof ROLES_APP)[number];

/**
 * Type-Guard para validar si una cadena arbitraria corresponde a un rol legítimo de la aplicación.
 *
 * @param valor - Cadena de texto a evaluar.
 * @returns `true` si el valor coincide con alguno de los roles en `ROLES_APP`, tipándolo como `Rol`.
 */
export const esRolApp = (valor: string): valor is Rol =>
  (ROLES_APP as readonly string[]).includes(valor);

/**
 * Variante de color Bootstrap asignada a cada rol para badges e indicadores visuales.
 */
export const ROL_COLORS: Record<Rol, string> = {
  SUPERADMIN: 'danger',
  ADMINISTRADOR: 'warning',
  BARBERO: 'info',
};

/**
 * Nivel numérico de jerarquía de autoridad (3 = Máxima autoridad, 1 = Base).
 * Utilizado por la especificación de reglas de negocio para determinar si un rol
 * puede cambiar el estado de otro usuario.
 */
export const ROL_HIERARCHY: Record<Rol, number> = {
  SUPERADMIN: 3,
  ADMINISTRADOR: 2,
  BARBERO: 1,
};

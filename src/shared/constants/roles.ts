/** Una sola fuente de verdad para roles, colores y jerarquía. */

export const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'] as const;
export type Rol = (typeof ROLES_APP)[number];

/** Type-guard: verifica si un string arbitrario es uno de los roles de la app. */
export const esRolApp = (valor: string): valor is Rol =>
  (ROLES_APP as readonly string[]).includes(valor);

/** Color Bootstrap asociado a cada rol. */
export const ROL_COLORS: Record<Rol, string> = {
  SUPERADMIN: 'danger',
  ADMINISTRADOR: 'warning',
  BARBERO: 'info',
};

/** Nivel numérico de jerarquía: mayor número = mayor autoridad. */
export const ROL_HIERARCHY: Record<Rol, number> = {
  SUPERADMIN: 3,
  ADMINISTRADOR: 2,
  BARBERO: 1,
};

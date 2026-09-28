export const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'] as const;
export type Rol = typeof ROLES_APP[number];

/** Type-guard: verifica si un string arbitrario es uno de los roles de la app. */
export const esRolApp = (valor: string): valor is Rol =>
  (ROLES_APP as readonly string[]).includes(valor);
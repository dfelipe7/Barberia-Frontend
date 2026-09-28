import type { Rol } from './roles';

const NIVEL: Record<Rol, number> = {
  SUPERADMIN: 3,
  ADMINISTRADOR: 2,
  BARBERO: 1,
};

/**
 * PATRÓN SPECIFICATION:
 * Encapsula la regla de negocio de jerarquía: un rol solo puede gestionar
 * (cambiar estado, editar) a roles de nivel estrictamente inferior al suyo.
 */
export const puedeGestionarEstado = (rolActor: Rol, rolObjetivo: Rol): boolean =>
  NIVEL[rolActor] > NIVEL[rolObjetivo];

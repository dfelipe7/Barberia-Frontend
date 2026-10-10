import { ROL_HIERARCHY } from '../../constants/roles';
import type { Rol } from '../../constants/roles';

/**
 * PATRÓN SPECIFICATION:
 * Encapsula la regla de negocio de jerarquía: un rol solo puede gestionar
 * (cambiar estado, editar) a roles de nivel estrictamente inferior al suyo.
 */
export const puedeGestionarEstado = (rolActor: Rol, rolObjetivo: Rol): boolean =>
  ROL_HIERARCHY[rolActor] > ROL_HIERARCHY[rolObjetivo];

import { ROL_HIERARCHY } from '../../constants/roles';
import type { Rol } from '../../constants/roles';

/**
 * PATRÓN SPECIFICATION / REGLA DE DOMINIO RBAC:
 * Encapsula la regla de negocio de jerarquía de roles: un rol actor solo puede gestionar
 * (cambiar estado, suspender o editar) a roles de nivel estrictamente inferior al suyo.
 *
 * @remarks
 * **Niveles de Jerarquía:**
 * - `SUPERADMIN` (Nivel 3): Puede gestionar a `ADMINISTRADOR` y `BARBERO`.
 * - `ADMINISTRADOR` (Nivel 2): Puede gestionar a `BARBERO`.
 * - `BARBERO` (Nivel 1): No puede gestionar a otros roles.
 *
 * Ningún rol puede auto-modificarse el estado ni modificar a un par del mismo nivel numérico.
 *
 * @param rolActor - Rol del usuario que intenta ejecutar la acción administrativa.
 * @param rolObjetivo - Rol del usuario sobre el cual recae la acción.
 * @returns `true` si el nivel de autoridad del actor supera al del objetivo; de lo contrario `false`.
 */
export const puedeGestionarEstado = (rolActor: Rol, rolObjetivo: Rol): boolean =>
  ROL_HIERARCHY[rolActor] > ROL_HIERARCHY[rolObjetivo];

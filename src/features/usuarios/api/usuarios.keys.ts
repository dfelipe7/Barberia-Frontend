/**
 * PATRÓN QUERY KEY FACTORY:
 * Centraliza jerárquicamente las claves de caché de TanStack Query para el feature usuarios.
 * Facilita invalidaciones precisas y previene colisiones o inconsistencias.
 */
export const usuariosKeys = {
  all: ['usuarios'] as const,
  perfil: () => [...usuariosKeys.all, 'me'] as const,
  administradores: () => [...usuariosKeys.all, 'administradores'] as const,
  details: () => [...usuariosKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...usuariosKeys.details(), Number(id)] as const,
};

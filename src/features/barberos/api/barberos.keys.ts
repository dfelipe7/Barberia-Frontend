export const barberosKeys = {
  all: ['barberos'] as const,
  catalogo: () => [...barberosKeys.all, 'catalogo'] as const,
  gestion: (filtro?: { estado?: 'ACTIVO' | 'INACTIVO'; nombre?: string }) =>
    filtro
      ? ([...barberosKeys.all, 'gestion', filtro] as const)
      : ([...barberosKeys.all, 'gestion'] as const),
  details: () => [...barberosKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...barberosKeys.details(), Number(id)] as const,
};

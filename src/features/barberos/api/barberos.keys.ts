export const barberosKeys = {
  all: ['barberos'] as const,
  catalogo: () => [...barberosKeys.all, 'catalogo'] as const,
  gestion: () => [...barberosKeys.all, 'gestion'] as const,
  details: () => [...barberosKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...barberosKeys.details(), Number(id)] as const,
};

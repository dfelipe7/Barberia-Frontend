export const serviciosKeys = {
  all: ['servicios'] as const,
  lists: () => [...serviciosKeys.all, 'list'] as const,
  detail: (id: number | string) => [...serviciosKeys.all, 'detail', Number(id)] as const,
};

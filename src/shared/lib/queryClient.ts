import { QueryClient } from '@tanstack/react-query';

/**
 * Instancia central de QueryClient para TanStack Query v5.
 * Configura políticas globales de caché, revalidación y reintentos.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de validez de caché por defecto
      gcTime: 1000 * 60 * 10,    // 10 minutos para garbage collection
      retry: 1,                 // 1 reintento antes de marcar como error
      refetchOnWindowFocus: false, // Evitar refetch agresivo al cambiar de pestaña
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;

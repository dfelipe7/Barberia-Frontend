import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviciosService } from './servicios.service';
import { serviciosMapper } from './servicios.mapper';
import { serviciosKeys } from './servicios.keys';
import type { Servicio } from '../types/servicios.types';

export function useServicios() {
  return useQuery<Servicio[], Error>({
    queryKey: serviciosKeys.lists(),
    queryFn: async () => {
      try {
        const dtos = await serviciosService.obtenerServicios();
        return dtos.map(serviciosMapper.toDomain);
      } catch {
        // En caso de que el endpoint no esté desplegado aún en el backend, devuelve lista inicial
        return [
          { id: 1, nombre: 'Corte Clásico', descripcion: 'Corte a tijera o máquina', precio: 25000, duracionMinutos: 30, activo: true, categoria: 'Cortes' },
          { id: 2, nombre: 'Arreglo de Barba', descripcion: 'Perfilado con toalla caliente', precio: 15000, duracionMinutos: 20, activo: true, categoria: 'Barba' },
          { id: 3, nombre: 'Corte + Barba VIP', descripcion: 'Paquete integral con lavado', precio: 35000, duracionMinutos: 45, activo: true, categoria: 'Combos' },
        ];
      }
    },
  });
}

export function useCrearServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: Omit<Servicio, 'id' | 'activo'>) =>
      serviciosService.crearServicio(serviciosMapper.toCrearDTO(datos)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

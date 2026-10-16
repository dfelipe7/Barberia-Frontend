export const horariosKeys = {
  all: ['horarios'] as const,
  miHorario: () => [...horariosKeys.all, 'mi-horario'] as const,
  bloqueos: () => [...horariosKeys.all, 'bloqueos'] as const,
  disponibilidad: () => [...horariosKeys.all, 'disponibilidad'] as const,
  disponibilidadFecha: (fecha: string) =>
    [...horariosKeys.disponibilidad(), fecha] as const,
};

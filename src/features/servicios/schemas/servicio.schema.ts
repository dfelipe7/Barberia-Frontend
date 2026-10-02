import { z } from 'zod';

export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar los 500 caracteres.')
    .optional()
    .or(z.literal('')),
  precio: z
    .number({ message: 'El precio debe ser un número' })
    .min(0, 'El precio no puede ser negativo.'),
  duracionMinutos: z
    .number({ message: 'La duración debe ser un número' })
    .int('La duración debe ser un número entero.')
    .min(1, 'La duración mínima es 1 minuto.'),
  barberoIds: z.array(z.number()).default([]),
});

export type ServicioFormValues = z.infer<typeof servicioSchema>;
export type ServicioFormInput = z.input<typeof servicioSchema>;

import { z } from 'zod';

export const productoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar los 500 caracteres.')
    .optional()
    .or(z.literal('')),
  precio: z
    .number({ message: 'El precio debe ser un número válido.' })
    .min(0.01, 'El precio debe ser mayor a 0.')
    .max(99999999.99, 'El precio no puede exceder $99,999,999.99.'),
  imagen: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      'La imagen no puede superar los 5 MB.'
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type),
      'Formato no válido. Solo JPG, PNG o WEBP.'
    ),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;
export type ProductoFormInput = z.input<typeof productoSchema>;


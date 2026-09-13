import { z } from 'zod';

export const crearBarberoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  telefono: z.string().trim().min(7, 'El teléfono debe tener al menos 7 dígitos.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  porcentajeComision: z
    .number({ message: 'La comisión debe ser un número' })
    .min(0, 'La comisión mínima es 0%')
    .max(100, 'La comisión máxima es 100%'),
});

export type CrearBarberoFormValues = z.infer<typeof crearBarberoSchema>;

export const actualizarComisionSchema = z.object({
  porcentajeComision: z
    .number({ message: 'La comisión debe ser un número' })
    .min(0, 'La comisión mínima es 0%')
    .max(100, 'La comisión máxima es 100%'),
});

export type ActualizarComisionFormValues = z.infer<typeof actualizarComisionSchema>;

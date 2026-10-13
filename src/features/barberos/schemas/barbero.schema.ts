import { z } from 'zod';
import {
  porcentajeComisionSchema,
  telefonoSchema,
} from '../../../shared/schemas/comunes.schema';

export const crearBarberoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  telefono: telefonoSchema,
  password: z.string().optional(),
  porcentajeComision: porcentajeComisionSchema,
});

export type CrearBarberoFormValues = z.infer<typeof crearBarberoSchema>;

export const actualizarComisionSchema = z.object({
  // porcentajeComisionSchema ya incluye .int() desde comunes.schema.ts
  porcentajeComision: porcentajeComisionSchema,
});

export type ActualizarComisionFormValues = z.infer<typeof actualizarComisionSchema>;

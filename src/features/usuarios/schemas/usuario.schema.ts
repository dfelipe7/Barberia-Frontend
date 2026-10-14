import { z } from 'zod';
import {
  porcentajeComisionSchema,
  emailSchema,
  telefonoSchema,
} from '../../../shared/schemas/comunes.schema';

export const crearAdministradorSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  apellido: z.string(),
  email: emailSchema,
});

export type CrearAdministradorFormValues = z.infer<typeof crearAdministradorSchema>;

export const editarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
    apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
    email: emailSchema,
    telefono: z.string(),
    porcentajeComision: porcentajeComisionSchema,
    esAdministrador: z.boolean(),
    esBarbero: z.boolean(),
  })
  .refine((data) => data.esAdministrador || data.esBarbero, {
    message: 'Debes asignar al menos un rol: Administrador o Barbero.',
    path: ['esBarbero'],
  });

export type EditarUsuarioFormValues = z.infer<typeof editarUsuarioSchema>;

export const configurarBarberoSchema = z.object({
  telefono: telefonoSchema,
  porcentajeComision: z
    .number({ message: 'La comisión debe ser un número' })
    .min(0, 'La comisión mínima es 0%')
    .max(100, 'La comisión no puede superar el 100%'),
});

export type ConfigurarBarberoFormValues = z.infer<typeof configurarBarberoSchema>;

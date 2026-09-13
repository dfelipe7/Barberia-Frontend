import { z } from 'zod';

export const crearAdministradorSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  apellido: z.string(),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export type CrearAdministradorFormValues = z.infer<typeof crearAdministradorSchema>;

export const editarUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  telefono: z.string(),
  porcentajeComision: z
    .number({ message: 'La comisión debe ser un número' })
    .min(0, 'La comisión mínima es 0%')
    .max(100, 'La comisión máxima es 100%'),
  esAdministrador: z.boolean(),
  esBarbero: z.boolean(),
});

export type EditarUsuarioFormValues = z.infer<typeof editarUsuarioSchema>;

export const miPerfilSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  telefono: z.string(),
});

export type MiPerfilFormValues = z.infer<typeof miPerfilSchema>;

export const cambiarContrasenaSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'La contraseña actual es obligatoria.'),
    nuevaContrasena: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    confirmarContrasena: z.string().min(8, 'Confirme la nueva contraseña.'),
  })
  .refine((data) => data.nuevaContrasena === data.confirmarContrasena, {
    message: 'La nueva contraseña y su confirmación no coinciden.',
    path: ['confirmarContrasena'],
  });

export type CambiarContrasenaFormValues = z.infer<typeof cambiarContrasenaSchema>;

export const configurarBarberoSchema = z.object({
  telefono: z.string().trim().min(7, 'El teléfono debe tener al menos 7 dígitos.'),
  porcentajeComision: z
    .number({ message: 'La comisión debe ser un número' })
    .min(0, 'La comisión mínima es 0%')
    .max(100, 'La comisión no puede superar el 100%'),
});

export type ConfigurarBarberoFormValues = z.infer<typeof configurarBarberoSchema>;

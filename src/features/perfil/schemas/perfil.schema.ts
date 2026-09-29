import { z } from 'zod';
import { passwordSchema } from '../../../shared/schemas/comunes.schema';

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
    nuevaContrasena: passwordSchema,
    confirmarContrasena: z.string().min(8, 'Confirme la nueva contraseña.'),
  })
  .refine((data) => data.nuevaContrasena === data.confirmarContrasena, {
    message: 'La nueva contraseña y su confirmación no coinciden.',
    path: ['confirmarContrasena'],
  });

export type CambiarContrasenaFormValues = z.infer<typeof cambiarContrasenaSchema>;

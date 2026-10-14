import { z } from 'zod';

export const miPerfilSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  telefono: z.string(),
});

export type MiPerfilFormValues = z.infer<typeof miPerfilSchema>;

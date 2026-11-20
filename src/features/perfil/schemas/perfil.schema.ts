import { z } from 'zod';
import { emailSchema } from '../../../shared/schemas/comunes.schema';

export const miPerfilSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  apellido: z.string().trim().min(2, 'El apellido es obligatorio.'),
  email: emailSchema,
  telefono: z.string(),
});

export type MiPerfilFormValues = z.infer<typeof miPerfilSchema>;

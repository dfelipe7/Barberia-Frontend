import { z } from 'zod';

export const porcentajeComisionSchema = z
  .number({ message: 'La comisión debe ser un número' })
  .min(0, 'La comisión mínima es 0%')
  .max(100, 'La comisión máxima es 100%');

export const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.');

export const emailSchema = z.string().trim().email('Ingrese un correo electrónico válido.');

export const telefonoSchema = z.string().trim().min(7, 'El teléfono debe tener al menos 7 dígitos.');

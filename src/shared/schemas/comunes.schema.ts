import { z } from 'zod';

export const porcentajeComisionSchema = z
  .number({ message: 'La comisión debe ser un número' })
  .min(0, 'La comisión mínima es 0%')
  .max(100, 'La comisión máxima es 100%')
  .int('La comisión debe ser un número entero.');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula (A-Z).')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula (a-z).')
  .regex(/[0-9]/, 'Debe incluir al menos un número (0-9).')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial (@, #, $, %, etc.).');

export const emailSchema = z.string().trim().email('Ingrese un correo electrónico válido.');

export const telefonoSchema = z.string().trim().min(7, 'El teléfono debe tener al menos 7 dígitos.');

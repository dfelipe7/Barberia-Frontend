import type { AxiosError } from 'axios';

/**
 * Traduce un error HTTP crudo de Axios a un mensaje entendible para el usuario final.
 * Centraliza la interpretación de códigos de estado documentados por el backend.
 */
export const mapApiError = (error: unknown): string => {
  // Fast-path: el interceptor de Axios ya normalizó message / mensaje del backend.
  const userMessage = (error as any)?.userMessage;
  if (typeof userMessage === 'string' && userMessage.trim()) return userMessage;

  // Fallback retrocompatible para errores no interceptados (tests, mocks, etc.)
  const axiosError = error as AxiosError<{ mensaje?: string }>;
  const status = axiosError?.response?.status;
  const mensajeBackend = axiosError?.response?.data?.mensaje;

  if (mensajeBackend) return mensajeBackend;
  if (status === 409) return 'Ya existe un registro con esos datos.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 401) return 'Tu sesión expiró, vuelve a iniciar sesión.';
  if (status === 400) return 'Los datos ingresados no son válidos.';
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

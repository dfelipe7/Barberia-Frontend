import type { AxiosError } from 'axios';

const extraerMensaje = (valor: unknown): string | undefined => {
  if (typeof valor === 'string' && valor.trim()) return valor;
  if (Array.isArray(valor)) {
    const mensajes = valor.filter(
      (item): item is string => typeof item === 'string' && Boolean(item.trim()),
    );
    if (mensajes.length) return mensajes.join(' ');
  }
  if (valor && typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    return extraerMensaje(objeto.message) ?? extraerMensaje(objeto.mensaje) ?? extraerMensaje(objeto.error);
  }
  return undefined;
};

/**
 * Traduce un error HTTP crudo de Axios a un mensaje entendible para el usuario final.
 * Centraliza la interpretación de códigos de estado documentados por el backend.
 */
export const mapApiError = (error: unknown): string => {
  // Fast-path: el interceptor de Axios ya normalizó message / mensaje del backend.
  const userMessage = extraerMensaje((error as { userMessage?: unknown } | null)?.userMessage);
  if (userMessage) return userMessage;

  // NestJS puede responder con `message` (string o lista) o con `mensaje`.
  // Este fallback también cubre clientes Axios que no tienen interceptor.
  const axiosError = error as AxiosError<unknown>;
  const status = axiosError?.response?.status;
  const mensajeBackend = extraerMensaje(axiosError?.response?.data);

  if (mensajeBackend) return mensajeBackend;
  if (status === 409) return 'Ya existe un registro con esos datos.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 401) return 'Tu sesión expiró, vuelve a iniciar sesión.';
  if (status === 400) return 'Los datos ingresados no son válidos.';
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

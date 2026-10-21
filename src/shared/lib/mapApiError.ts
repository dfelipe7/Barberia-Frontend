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
  const axiosError = error as AxiosError<unknown>;
  const status = axiosError?.response?.status;

  // Los fallos de autorización y disponibilidad se traducen antes de leer
  // message para no exponer textos internos del servidor en la interfaz.
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
  if (status === 403) return 'Tu cuenta no tiene permiso para realizar esta acción.';
  if (status === 503) return 'Esta función no está disponible por el momento. Inténtalo de nuevo más tarde.';
  if (status === 502 || status === 504 || (status !== undefined && status >= 500)) {
    return 'No fue posible completar la solicitud. Inténtalo de nuevo más tarde.';
  }

  // Fast-path: el interceptor de Axios ya normalizó message / mensaje del backend.
  const userMessage = extraerMensaje((error as { userMessage?: unknown } | null)?.userMessage);
  if (userMessage && !/^(internal server error|bad gateway|service unavailable|not found|bad request|cannot (get|post|patch|put|delete)\s)/i.test(userMessage)) {
    return userMessage;
  }

  // NestJS puede responder con `message` (string o lista) o con `mensaje`.
  // Este fallback también cubre clientes Axios que no tienen interceptor.
  const mensajeBackend = extraerMensaje(axiosError?.response?.data);

  if (mensajeBackend && !/^(internal server error|bad gateway|service unavailable|not found|bad request|cannot (get|post|patch|put|delete)\s)/i.test(mensajeBackend)) {
    return mensajeBackend;
  }
  if (status === 404) return 'No encontramos la información solicitada.';
  if (status === 409) return 'Ese horario o registro cambió y ya no está disponible. Actualiza la información e inténtalo de nuevo.';
  if (status === 400) return 'Los datos ingresados no son válidos.';
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

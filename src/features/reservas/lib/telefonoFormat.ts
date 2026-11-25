/**
 * Utilidades para formateo y validación de números telefónicos en el flujo de reserva.
 */

/**
 * Limpia y formatea un número telefónico en tiempo real para visualización legible.
 * Ejemplo: "3001234567" -> "300 123 4567"
 *          "+573001234567" -> "+57 300 123 4567"
 */
export function formatearTelefonoInput(valor: string): string {
  if (!valor) return '';

  const tieneMas = valor.trim().startsWith('+');
  // Extraer solo dígitos
  const soloDigitos = valor.replace(/\D/g, '');

  if (!soloDigitos) {
    return tieneMas ? '+' : '';
  }

  // Si tiene prefijo internacional con "+"
  if (tieneMas) {
    // Si empieza por 57 (Colombia) u otros prefijos de 2 dígitos
    if (soloDigitos.startsWith('57') && soloDigitos.length > 2) {
      const resto = soloDigitos.slice(2);
      if (resto.length <= 3) return `+57 ${resto}`;
      if (resto.length <= 6) return `+57 ${resto.slice(0, 3)} ${resto.slice(3)}`;
      return `+57 ${resto.slice(0, 3)} ${resto.slice(3, 6)} ${resto.slice(6, 10)}`;
    }

    // Prefijo internacional genérico
    if (soloDigitos.length <= 3) return `+${soloDigitos}`;
    if (soloDigitos.length <= 6) return `+${soloDigitos.slice(0, 2)} ${soloDigitos.slice(2)}`;
    if (soloDigitos.length <= 10) {
      return `+${soloDigitos.slice(0, 2)} ${soloDigitos.slice(2, 5)} ${soloDigitos.slice(5)}`;
    }
    return `+${soloDigitos.slice(0, 2)} ${soloDigitos.slice(2, 5)} ${soloDigitos.slice(5, 9)} ${soloDigitos.slice(9, 13)}`;
  }

  // Formato local estándar (ej. 300 123 4567)
  if (soloDigitos.length <= 3) return soloDigitos;
  if (soloDigitos.length <= 6) return `${soloDigitos.slice(0, 3)} ${soloDigitos.slice(3)}`;
  if (soloDigitos.length <= 10) {
    return `${soloDigitos.slice(0, 3)} ${soloDigitos.slice(3, 6)} ${soloDigitos.slice(6)}`;
  }

  // Si excede 10 dígitos (ej. fijos con extensión o internacionales sin +)
  return `${soloDigitos.slice(0, 3)} ${soloDigitos.slice(3, 6)} ${soloDigitos.slice(6, 10)} ${soloDigitos.slice(10, 15)}`;
}

/**
 * Normaliza el teléfono eliminando espacios para guardado o envío a la API.
 */
export function normalizarTelefono(valor: string): string {
  if (!valor) return '';
  const tieneMas = valor.trim().startsWith('+');
  const digitos = valor.replace(/\D/g, '');
  return tieneMas ? `+${digitos}` : digitos;
}

export interface ResultadoValidacionTelefono {
  valido: boolean;
  mensaje?: string;
  tipo?: 'exito' | 'incompleto' | 'invalido';
}

/**
 * Valida si un número telefónico tiene la estructura mínima requerida para recibir WhatsApp.
 */
export function validarTelefono(valor: string): ResultadoValidacionTelefono {
  const normalizado = normalizarTelefono(valor);
  const digitos = valor.replace(/\D/g, '');

  if (!digitos) {
    return { valido: false, mensaje: 'El teléfono es obligatorio para agendar', tipo: 'incompleto' };
  }

  // Si tiene menos de 7 dígitos es muy corto para cualquier teléfono
  if (digitos.length < 7) {
    return {
      valido: false,
      mensaje: `Faltan dígitos (${digitos.length}/10)`,
      tipo: 'incompleto',
    };
  }

  // Si parece celular colombiano (empieza por 3 y no tiene prefijo internacional)
  if (!normalizado.startsWith('+') && digitos.startsWith('3')) {
    if (digitos.length < 10) {
      return {
        valido: false,
        mensaje: `Número celular incompleto (${digitos.length}/10 dígitos)`,
        tipo: 'incompleto',
      };
    }
    if (digitos.length === 10) {
      return { valido: true, mensaje: 'Número de WhatsApp válido', tipo: 'exito' };
    }
  }

  // Teléfonos con prefijo internacional (+57...)
  if (normalizado.startsWith('+')) {
    if (digitos.length < 9) {
      return { valido: false, mensaje: 'Número internacional incompleto', tipo: 'incompleto' };
    }
    return { valido: true, mensaje: 'Número internacional válido', tipo: 'exito' };
  }

  // Teléfonos fijos o generales de al menos 7 dígitos
  if (digitos.length >= 7 && digitos.length <= 15) {
    return { valido: true, mensaje: 'Número válido', tipo: 'exito' };
  }

  return { valido: false, mensaje: 'Formato de teléfono no admitido', tipo: 'invalido' };
}

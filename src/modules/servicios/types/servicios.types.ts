/**
 * Subestructura de barbero asignado a un servicio dentro del catálogo de respuestas.
 */
export interface BarberoEnServicio {
    id: number;
    nombre: string;
    apellido: string;
    fotoUrl?: string | null;
}

/**
 * Estructura de respuesta principal para servicios.
 * Coincide 1:1 con ServicioResponseDto del Backend.
 */
export interface Servicio {
    id: number;
    nombre: string;
    descripcion?: string | null;
    precio: number;
    duracionMinutos: number;
    fotoUrl?: string | null;
    estado: 'ACTIVO' | 'INACTIVO';
    barberos: BarberoEnServicio[];
}

/**
 * Payload para crear un nuevo servicio.
 */
export interface CrearServicioPayload {
    nombre: string;
    descripcion?: string;
    precio: number;
    duracionMinutos: number;
    fotoUrl?: string;
    barberoIds?: number[];
}

/**
 * Payload para actualizar un servicio existente.
 */
export interface ActualizarServicioPayload {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    duracionMinutos?: number;
    fotoUrl?: string;
    barberoIds?: number[];
}

/**
 * Filtros de búsqueda para consultar servicios.
 */
export interface FiltroServicios {
    nombre?: string;
    estado?: string;
}

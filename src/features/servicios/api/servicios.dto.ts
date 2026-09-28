export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
  categoria?: string;
  imagenUrl?: string;
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  categoria?: string;
  imagenUrl?: string;
}

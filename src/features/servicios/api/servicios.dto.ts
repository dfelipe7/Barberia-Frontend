export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
  categoria?: string;
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  categoria?: string;
}

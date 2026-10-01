export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
  categoria?: string;
  fotoUrl?: string;
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  categoria?: string;
  fotoUrl?: string;
}

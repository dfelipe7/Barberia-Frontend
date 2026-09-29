export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
  categoria?: string;
  imagenUrl?: string;
}

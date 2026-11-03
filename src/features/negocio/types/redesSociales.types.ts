export type TipoRedSocial = 'TIKTOK' | 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'OTRO';

export interface RedSocial {
  id: number;
  tipo: TipoRedSocial;
  nombre: string;
  url: string;
  orden: number;
  activo: boolean;
}

export interface CrearRedSocialDto {
  tipo: TipoRedSocial;
  nombre?: string;
  url: string;
  orden?: number;
}

export interface ActualizarRedSocialDto {
  url?: string;
  nombre?: string;
  orden?: number;
}

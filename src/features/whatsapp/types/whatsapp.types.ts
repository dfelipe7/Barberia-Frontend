export interface WhatsAppStatus {
  conectado: boolean;
  qr: string | null;
}

export interface DesconectarResponse {
  mensaje: string;
}

export interface WhatsAppPlantillas {
  confirmacion: string;
  recordatorio: string;
}

export interface ActualizarPlantillasDTO {
  confirmacion?: string;
  recordatorio?: string;
}

import apiClient from '../../../shared/lib/http/axios';
import type { CambiarContrasenaDTO } from './perfil.dto';

export const perfilService = {
  async cambiarContrasena(datos: CambiarContrasenaDTO): Promise<{ mensaje: string }> {
    const response = await apiClient.patch('/auth/cambiar-contrasena', datos);
    return response.data;
  },
};

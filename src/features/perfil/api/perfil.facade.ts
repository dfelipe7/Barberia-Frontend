import { useMutation } from '@tanstack/react-query';
import { perfilService } from './perfil.service';
import type { CambiarContrasenaDTO } from './perfil.dto';

export function useCambiarContrasena() {
  return useMutation({
    mutationFn: (datos: CambiarContrasenaDTO) => perfilService.cambiarContrasena(datos),
  });
}

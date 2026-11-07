import { Link } from 'react-router-dom';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { whatsappService } from '../../features/whatsapp/api/whatsapp.service';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';

/**
 * Indicador de salud de WhatsApp en el header principal.
 *
 * Visibilidad:
 * Exclusivo para administradores y superadministradores.
 * Informa el estado de conexión del socket de la sede actual y ofrece
 * un enlace directo a la pantalla de configuración para escanear el QR si
 * la sesión se encuentra desconectada.
 */
export default function WhatsAppStatusIndicator() {
  const { roles, isAuthenticated } = useAuth();
  const slugActivo =
    obtenerNegocioSlugActivo() ||
    localStorage.getItem('negocio_slug') ||
    'kyrios-studio';

  const esAdmin =
    roles.includes('ADMINISTRADOR') || roles.includes('SUPERADMIN');

  const { data: status, isError, isLoading } = useQuery({
    queryKey: ['whatsapp-status', slugActivo],
    queryFn: () => whatsappService.getStatus(),
    enabled: Boolean(isAuthenticated && esAdmin),
    refetchInterval: (query) => (query.state.data?.conectado ? 60_000 : 25_000),
    staleTime: 15_000,
    retry: false,
  });

  if (!isAuthenticated || !esAdmin || isLoading) {
    return null;
  }

  const estaConectado = Boolean(status?.conectado);
  const destino = `/${slugActivo}/whatsapp`;

  if (estaConectado) {
    return (
      <Link
        to={destino}
        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 header-action-btn"
        title="WhatsApp conectado (notificaciones automáticas activas)"
        aria-label="WhatsApp conectado"
        style={{ fontSize: '0.825rem' }}
      >
        <span
          className="d-inline-block rounded-circle bg-success"
          style={{ width: '8px', height: '8px' }}
          aria-hidden="true"
        />
        <MessageSquare size={14} strokeWidth={2} />
        <span className="d-none d-xl-inline">WhatsApp</span>
      </Link>
    );
  }

  return (
    <Link
      to={destino}
      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 header-action-btn"
      title={
        isError
          ? 'Error al verificar WhatsApp. Clic para revisar configuración.'
          : 'WhatsApp desconectado: las notificaciones automáticas están pausadas. Clic para escanear QR.'
      }
      aria-label="WhatsApp desconectado"
      style={{ fontSize: '0.825rem' }}
    >
      <AlertCircle size={14} strokeWidth={2} className="text-danger" />
      <span className="d-none d-md-inline fw-semibold text-danger">
        WhatsApp offline
      </span>
      <span className="d-md-none text-danger">Offline</span>
    </Link>
  );
}

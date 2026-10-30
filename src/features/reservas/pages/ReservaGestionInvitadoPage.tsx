import { useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock3,
  Scissors,
  UserRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { reservasService } from '../api/reservas.service';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import Button from '../../../shared/ui/Button';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import BackLink from '../../../shared/ui/BackLink';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { mapApiError } from '../../../shared/lib/mapApiError';

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia, 12);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

const formatearPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

export default function ReservaGestionInvitadoPage() {
  const { slug, id: idParamFromRoute, token: tokenParamFromRoute } = useParams<{
    slug?: string;
    id?: string;
    token?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const slugActivo = slug || obtenerNegocioSlugActivo() || 'kyrios-studio';
  const idRaw = idParamFromRoute || searchParams.get('id');
  const tokenRaw = tokenParamFromRoute || searchParams.get('token');

  const reservaId = idRaw ? Number(idRaw) : null;
  const token = tokenRaw ? tokenRaw.trim() : null;

  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const {
    data: reserva,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reserva-invitado', reservaId, token],
    queryFn: () => reservasService.obtenerReservaInvitado(reservaId!, token!),
    enabled: Boolean(reservaId && reservaId > 0 && token),
    staleTime: 10_000,
  });

  const cancelarMutation = useMutation({
    mutationFn: () => reservasService.cancelarReservaInvitado(reservaId!, token!),
    onSuccess: (data) => {
      setAvisoExito(data.mensaje || 'Tu cita fue cancelada exitosamente.');
      void queryClient.invalidateQueries({ queryKey: ['reserva-invitado', reservaId, token] });
    },
    onError: (err) => {
      setErrorAccion(mapApiError(err));
    },
  });

  const copiarCodigo = (codigo: number | string) => {
    void navigator.clipboard.writeText(String(codigo)).then(() => {
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    });
  };

  const handleCancelar = async () => {
    if (!reserva) return;
    setErrorAccion(null);

    const confirmado = await confirm({
      title: 'Cancelar cita',
      message: (
        <div>
          <p className="mb-2">¿Estás seguro de que deseas cancelar tu cita?</p>
          <div
            className="p-3 rounded mb-2 border"
            style={{
              backgroundColor: 'var(--surface-app-bg)',
              borderColor: 'var(--surface-card-border)',
            }}
          >
            <div className="fw-bold text-surface-primary mb-1">
              {reserva.servicio.nombre}
            </div>
            <div className="small text-surface-muted mb-1">
              Barbero: <strong>{reserva.barbero.nombre} {reserva.barbero.apellido}</strong>
            </div>
            <div className="small text-surface-muted">
              Fecha y hora: {reserva.fecha} · {reserva.hora}
            </div>
          </div>
          <p className="small text-danger mb-0">
            El horario quedará liberado inmediatamente para otros clientes.
          </p>
        </div>
      ),
      confirmLabel: 'Sí, cancelar cita',
      cancelLabel: 'Conservar cita',
      variant: 'danger',
    });

    if (confirmado) {
      cancelarMutation.mutate();
    }
  };

    const handleReprogramar = () => {
    if (!reserva) return;
    reservasService.guardarTokenGestionInvitado(reserva.id, token!);

    navigate(
      `/${slugActivo}/reservar?paso=3&reservaId=${reserva.id}&servicioId=${reserva.servicio.id}&barberoId=${reserva.barbero.id}&token=${encodeURIComponent(token!)}&fecha=${encodeURIComponent(reserva.fecha)}`,
      {
        state: {
          reservaId: reserva.id,
          servicioId: reserva.servicio.id,
          barberoId: reserva.barbero.id,
          token,
          fecha: reserva.fecha,
          hora: null,
        },
      },
    );
  };

  const handleCambiarBarbero = () => {
    if (!reserva) return;
    reservasService.guardarTokenGestionInvitado(reserva.id, token!);

    navigate(
      `/${slugActivo}/reservar?paso=2&reservaId=${reserva.id}&servicioId=${reserva.servicio.id}&token=${encodeURIComponent(token!)}`,
      {
        state: {
          reservaId: reserva.id,
          servicioId: reserva.servicio.id,
          token,
        },
      },
    );
  };

// 1. Validar parámetros requeridos en URL
  if (!reservaId || !token) {
    return (
      <main className="container py-5" style={{ maxWidth: '640px' }}>
        <div className="card card-surface border-0 shadow-sm p-4 text-center">
          <div className="text-warning mb-3">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="h4 fw-bold mb-2">Enlace de gestión incompleto</h2>
          <p className="text-surface-muted mb-4 small">
            No se encontraron los identificadores de seguridad necesarios para acceder a tu cita.
            Por favor, revisa el enlace completo que te enviamos al momento de confirmar.
          </p>
          <div>
            <Link to={`/${slugActivo}`} className="btn btn-primary px-4 py-2">
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Estado de carga
  if (isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <KyriosSpinner />
        <p className="small text-surface-muted mt-3">Consultando los detalles de tu cita...</p>
      </div>
    );
  }

  // 3. Error / Cita no encontrada o token inválido
  if (isError || !reserva) {
    return (
      <main className="container py-5" style={{ maxWidth: '640px' }}>
        <div className="card card-surface border-0 shadow-sm p-4 text-center">
          <div className="text-danger mb-3">
            <XCircle size={48} className="mx-auto" />
          </div>
          <h2 className="h4 fw-bold mb-2">Cita no disponible</h2>
          <p className="text-surface-muted mb-4 small">
            {mapApiError(error) || 'La cita solicitada no existe o el enlace de gestión ya no es válido.'}
          </p>
          <div>
            <Link to={`/${slugActivo}`} className="btn btn-outline-secondary px-4 py-2">
              Volver al sitio de la barbería
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const esGestionable = reserva.estado === 'PENDING' || reserva.estado === 'CONFIRMED';
  const esCancelada = reserva.estado === 'CANCELLED';
  const esCompletada = reserva.estado === 'COMPLETED';

  return (
    <main className="container py-4 py-lg-5" style={{ maxWidth: '720px' }}>
      <header className="mb-4">
        <BackLink to={`/${slugActivo}`}>Volver al sitio de la barbería</BackLink>
        <span className="text-eyebrow d-block mt-3 mb-1">AUTOGESTIÓN DE CITA</span>
        <h1 className="h2 fw-bold mb-1">Tu Cita en Kyrios Barber</h1>
        <p className="text-surface-muted small mb-0">
          Desde aquí puedes consultar los detalles, reprogramar fecha u hora, o cancelarla si no puedes asistir.
        </p>
      </header>

      {avisoExito && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{avisoExito}</span>
        </div>
      )}

      {errorAccion && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorAccion}</span>
        </div>
      )}

      {/* Tarjeta Voucher de la Cita */}
      <section className="card card-surface border-0 shadow-sm p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 border-bottom mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-surface-muted">Cita:</span>
            <strong className="font-monospace fs-6">#{reserva.id}</strong>
            <button
              type="button"
              className="btn btn-sm btn-link text-surface-muted p-0 ms-1 text-decoration-none"
              title="Copiar código de cita"
              onClick={() => copiarCodigo(reserva.id)}
            >
              {codigoCopiado ? (
                <span className="badge bg-success text-white py-1">¡Copiado!</span>
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <div>
            {esCancelada ? (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1.5 rounded-pill">
                ● Cita Cancelada
              </span>
            ) : esCompletada ? (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1.5 rounded-pill">
                ✓ Completada
              </span>
            ) : (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill">
                ● Cita Programada
              </span>
            )}
          </div>
        </div>

        {/* Bloque Destacado de Fecha y Hora */}
        <div
          className="rounded-4 p-3 mb-4 border d-flex align-items-center justify-content-between gap-3"
          style={{ backgroundColor: 'var(--surface-app-bg)', borderColor: 'var(--surface-card-border)' }}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 rounded-circle bg-primary-subtle text-primary" aria-hidden="true">
              <CalendarDays size={24} />
            </div>
            <div>
              <span className="small text-uppercase tracking-wider text-surface-muted d-block" style={{ fontSize: '0.72rem' }}>
                Fecha programada
              </span>
              <strong className="fs-6 text-capitalize d-block text-surface-primary">
                {formatearFecha(reserva.fecha)}
              </strong>
            </div>
          </div>
          <div className="text-end">
            <span className="small text-surface-muted d-block" style={{ fontSize: '0.72rem' }}>Hora</span>
            <strong className="fs-4 text-primary font-monospace">{reserva.hora}</strong>
          </div>
        </div>

        {/* Fila de Detalles */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6">
            <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: 'var(--surface-card-bg)' }}>
              <div className="d-flex align-items-center gap-2 mb-1 text-surface-muted small">
                <Scissors size={14} className="text-primary" />
                <span className="text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Servicio</span>
              </div>
              <strong className="d-block text-surface-primary mb-1">{reserva.servicio.nombre}</strong>
              <div className="small text-primary fw-bold">{formatearPrecio(reserva.precio)}</div>
            </div>
          </div>

          <div className="col-12 col-sm-6">
            <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: 'var(--surface-card-bg)' }}>
              <div className="d-flex align-items-center gap-2 mb-1 text-surface-muted small">
                <UserRound size={14} className="text-primary" />
                <span className="text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Barbero Asignado</span>
              </div>
              <strong className="d-block text-surface-primary mb-1">
                {reserva.barbero.nombre} {reserva.barbero.apellido}
              </strong>
              <span className="badge border text-primary border-primary-subtle small">
                Especialista
              </span>
            </div>
          </div>
        </div>

        {/* Acciones de Autogestión */}
        {esGestionable && (
          <div className="pt-3 border-top">
            <h2 className="h6 fw-bold mb-2">Opciones de gestión</h2>
            <p className="small text-surface-muted mb-3">
              Si tus planes cambiaron, puedes elegir otro horario disponible o cancelar tu turno.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleReprogramar}
                icon={<Clock3 size={16} />}
              >
                Cambiar fecha u hora
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleCambiarBarbero}
                icon={<UserRound size={16} />}
              >
                Cambiar de barbero
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                disabled={cancelarMutation.isPending}
                onClick={handleCancelar}
                icon={<XCircle size={16} />}
              >
                {cancelarMutation.isPending ? 'Cancelando...' : 'Cancelar cita'}
              </Button>
            </div>
          </div>
        )}

        {esCancelada && (
          <div className="pt-3 border-top text-center">
            <p className="small text-surface-muted mb-3">
              Esta cita fue cancelada y la franja horaria fue liberada. ¿Deseas agendar un nuevo corte?
            </p>
            <Link to={`/${slugActivo}/reservar`} className="btn btn-primary px-4 py-2">
              Agendar una nueva cita
            </Link>
          </div>
        )}
      </section>

      {/* Recordatorio de llegada */}
      <div className="text-center">
        <p className="small text-surface-muted mb-0">
          📍 Te esperamos en nuestras instalaciones. Recuerda llegar con 5 minutos de anticipación.
        </p>
      </div>
    </main>
  );
}

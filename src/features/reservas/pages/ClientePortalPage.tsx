import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  CalendarDays,
  Clock3,
  User,
  Scissors,
  Phone,
  Mail,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Heart,
  Award,
} from 'lucide-react';
import { clientesService } from '../api/reservas.service';
import {
  useMisReservas,
  useCancelarMiReserva,
  usePerfilCliente,
  useActualizarPerfilCliente,
} from '../api/reservas.facade';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import BrandLogo from '../../../shared/ui/BrandLogo';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useTenantBrand } from '../../negocio/context/TenantBrandContext';
import './ClientePortalPage.css';

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(anio, mes - 1, dia, 12));
};

const formatearPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

const mapearEstado = (estado: string) => {
  const estados: Record<string, string> = {
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En atención',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
  };
  return estados[estado] ?? estado;
};

export default function ClientePortalPage() {
  const navigate = useNavigate();
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const { theme, setTheme, isDark } = useTheme();
  const { nombreNegocio } = useTenantBrand();
  const effectiveName = nombreNegocio || 'Kyrios Barber Studio';

  const slugActivo = paramSlug || obtenerNegocioSlugActivo() || '';
  const sesion = clientesService.obtenerSesion(slugActivo);
  const tokenStaffLocal = slugActivo ? localStorage.getItem(`token_barberia_${slugActivo}`) : null;
  const tieneSesionStaff = Boolean(tokenStaffLocal);

  // Si no hay sesión de cliente activa, redirigir a inicio de sesión
  useEffect(() => {
    if (!sesion) {
      const rutaDestino = slugActivo
        ? `/${slugActivo}/cliente/iniciar-sesion?returnTo=/${slugActivo}/cliente/mi-cuenta`
        : `/cliente/iniciar-sesion?returnTo=/cliente/mi-cuenta`;
      navigate(rutaDestino, { replace: true });
    }
  }, [sesion, slugActivo, navigate]);

  const tabActiva = searchParams.get('tab') || 'citas';

  // Toggle de tema: claro -> oscuro -> sistema
  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel =
    theme === 'dark' ? 'Modo oscuro' : theme === 'light' ? 'Modo claro' : 'Tema del sistema';

  // Consultas React Query
  const {
    data: reservasData,
    isLoading: cargandoReservas,
    error: errorReservas,
    refetch: refetchReservas,
  } = useMisReservas(Boolean(sesion));

  const {
    data: perfil,
  } = usePerfilCliente(Boolean(sesion));

  const cancelarReserva = useCancelarMiReserva();
  const actualizarPerfil = useActualizarPerfilCliente();

  // Estado del formulario de perfil
  const [telefono, setTelefono] = useState('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  useEffect(() => {
    if (perfil?.telefono) {
      setTelefono(perfil.telefono);
    }
  }, [perfil?.telefono]);

  const handleCerrarSesion = () => {
    clientesService.cerrarSesion(slugActivo);
    navigate(slugActivo ? `/${slugActivo}` : '/', { replace: true });
  };

  const handleGuardarTelefono = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGuardado(null);
    setGuardadoExitoso(false);

    if (!telefono.trim()) {
      setErrorGuardado('Ingresa un número de WhatsApp válido.');
      return;
    }

    try {
      await actualizarPerfil.mutateAsync({ telefono: telefono.trim() });
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 4000);
    } catch (err) {
      setErrorGuardado(mapApiError(err));
    }
  };

  const handleCancelarCita = async (reservaId: number, nombreServicio: string, fecha: string, hora: string) => {
    const confirmado = await confirm({
      title: 'Cancelar cita',
      message: (
        <div>
          <p className="mb-2">¿Seguro que deseas cancelar tu turno para <strong>{nombreServicio}</strong>?</p>
          <p className="small text-muted mb-2">Fecha y hora: {fecha} · {hora}</p>
          <p className="small text-danger mb-0">La franja horaria se liberará de inmediato para otros clientes.</p>
        </div>
      ),
      confirmLabel: 'Sí, cancelar cita',
      cancelLabel: 'Conservar cita',
      variant: 'danger',
    });

    if (!confirmado) return;

    try {
      await cancelarReserva.mutateAsync(reservaId);
      void refetchReservas();
    } catch (err) {
      await confirm({
        title: 'Error al cancelar',
        message: mapApiError(err),
        confirmLabel: 'Entendido',
        variant: 'danger',
      });
    }
  };

  const reservas = reservasData?.reservas ?? [];
  const hoyStr = new Date().toISOString().split('T')[0];

  // Separar próximas citas de históricas
  const proximasCitas = reservas.filter(
    (r) => (r.estado === 'PENDING' || r.estado === 'CONFIRMED') && r.fecha >= hoyStr
  );
  const historialCitas = reservas.filter(
    (r) => !proximasCitas.some((p) => p.id === r.id)
  );

  const iniciales = (sesion?.nombre?.[0] || 'C') + (sesion?.apellido?.[0] || '');

  return (
    <div className="cliente-portal">
      {/* Fondo y luz ambiental */}
      <div className="cliente-portal__ambient-glow" aria-hidden="true" />
      <div className="cliente-portal__grid-pattern" aria-hidden="true" />

      <div className="cliente-portal__container">
        {/* Barra superior de navegación */}
        <div className="cliente-portal__top-nav">
          <div className="d-flex align-items-center gap-3">
            <Link to={slugActivo ? `/${slugActivo}` : '/'} className="cliente-portal__back-link">
              <ArrowLeft size={16} /> Volver a la barbería
            </Link>
          </div>
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {tieneSesionStaff && (
              <Link
                to={slugActivo ? `/${slugActivo}/dashboard` : '/dashboard'}
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  textDecoration: 'none',
                }}
                title="Volver a tu panel de administración (Staff)"
              >
                <ShieldCheck size={14} />
                <span className="d-none d-sm-inline">Panel Staff</span>
              </Link>
            )}
            <BrandLogo variant={isDark ? 'white' : 'black'} height={28} alt={effectiveName} />
            
            {/* Toggle de Modo Claro / Modo Oscuro */}
            <button
              type="button"
              className="cliente-portal__theme-toggle"
              onClick={cycleTheme}
              title={`Cambiar tema (actual: ${themeLabel})`}
              aria-label={`Cambiar tema (actual: ${themeLabel})`}
            >
              <ThemeIcon size={17} />
            </button>

            <button
              type="button"
              className="cliente-portal__logout-btn"
              onClick={handleCerrarSesion}
              title="Cerrar sesión de cliente"
            >
              <LogOut size={13} />
              <span className="d-none d-sm-inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Hero Card del Cliente VIP */}
        <header className="cliente-portal__hero-card">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="cliente-portal__avatar-vip">{iniciales.toUpperCase()}</div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="cliente-portal__vip-pill">
                    <Sparkles size={11} /> Mi Cuenta de Cliente
                  </span>
                </div>
                <h1 className="cliente-portal__hero-name">
                  {perfil?.nombre || sesion?.nombre} {perfil?.apellido || sesion?.apellido || ''}
                </h1>
                <span className="cliente-portal__hero-email">{perfil?.email || sesion?.email}</span>
                <div>
                  {perfil?.telefono ? (
                    <span className="cliente-portal__phone-status cliente-portal__phone-status--active">
                      <Phone size={12} /> WhatsApp de avisos: {perfil.telefono}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="cliente-portal__phone-status cliente-portal__phone-status--missing border-0 text-start"
                      onClick={() => setSearchParams({ tab: 'perfil' })}
                    >
                      <AlertCircle size={12} /> Sin WhatsApp registrado (haz clic para agregarlo)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Link
                to={slugActivo ? `/${slugActivo}/reservar` : '/reservar'}
                className="btn-kyrios-agendar"
              >
                <Plus size={16} /> Agendar nueva cita
              </Link>
            </div>
          </div>
        </header>

        {/* Pestañas de Navegación con Preparación para Futuras Vistas */}
        <nav className="cliente-portal__nav-tabs" aria-label="Secciones del portal">
          <button
            type="button"
            className={`cliente-portal__tab-button ${tabActiva === 'citas' ? 'is-active' : ''}`}
            onClick={() => setSearchParams({ tab: 'citas' })}
          >
            <Calendar size={17} /> Mis Citas
            {proximasCitas.length > 0 && (
              <span className="cliente-portal__counter-pill">{proximasCitas.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`cliente-portal__tab-button ${tabActiva === 'perfil' ? 'is-active' : ''}`}
            onClick={() => setSearchParams({ tab: 'perfil' })}
          >
            <User size={17} /> Mi WhatsApp y Contacto
          </button>

          {/* Futuras Vistas (Preparadas) */}
          <button
            type="button"
            className={`cliente-portal__tab-button ${tabActiva === 'favoritos' ? 'is-active' : ''}`}
            onClick={() => setSearchParams({ tab: 'favoritos' })}
          >
            <Heart size={16} /> Mis Favoritos
            <span className="cliente-portal__soon-pill">Pronto</span>
          </button>

          <button
            type="button"
            className={`cliente-portal__tab-button ${tabActiva === 'fidelizacion' ? 'is-active' : ''}`}
            onClick={() => setSearchParams({ tab: 'fidelizacion' })}
          >
            <Award size={16} /> Tarjeta de Fidelización
            <span className="cliente-portal__soon-pill">Pronto</span>
          </button>
        </nav>

        {/* CONTENIDO PESTAÑA 1: MIS CITAS */}
        {tabActiva === 'citas' && (
          <section aria-labelledby="mis-citas-titulo">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 id="mis-citas-titulo" className="h5 fw-bold mb-0">
                Próximas Citas
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                onClick={() => void refetchReservas()}
                title="Actualizar listado de citas"
                style={{ borderRadius: '8px' }}
              >
                <RefreshCw size={13} /> Refrescar agenda
              </button>
            </div>

            {cargandoReservas && (
              <div className="text-center py-5">
                <KyriosSpinner size="md" mensaje="Cargando tus citas..." />
              </div>
            )}

            {errorReservas && (
              <div className="alert alert-warning mb-4 rounded-3">
                <ErrorMessage message={mapApiError(errorReservas)} />
              </div>
            )}

            {!cargandoReservas && !errorReservas && proximasCitas.length === 0 && (
              <div className="cliente-portal__empty-state">
                <CalendarDays size={48} className="opacity-50 mb-3 mx-auto" style={{ color: 'var(--portal-primary)' }} />
                <h3 className="h5 fw-bold mb-1">No tienes citas próximas agendadas</h3>
                <p className="small text-muted mb-4" style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Elige el servicio de tu preferencia y asegura tu turno con tu barbero favorito.
                </p>
                <Link
                  to={slugActivo ? `/${slugActivo}/reservar` : '/reservar'}
                  className="btn-kyrios-agendar"
                >
                  <Plus size={16} /> Ver disponibilidad y agendar
                </Link>
              </div>
            )}

            {!cargandoReservas && proximasCitas.length > 0 && (
              <div className="mb-4">
                {proximasCitas.map((reserva) => (
                  <div key={reserva.id} className="cliente-ticket-card">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`cliente-ticket__badge-status badge-status--${reserva.estado}`}>
                          ● {mapearEstado(reserva.estado)}
                        </span>
                        <span className="small text-muted font-monospace">#{reserva.id}</span>
                      </div>
                      <strong className="cliente-ticket__price">
                        {formatearPrecio(reserva.precio)}
                      </strong>
                    </div>

                    <div className="row g-3 align-items-center mb-3">
                      <div className="col-12 col-md-5">
                        <div className="cliente-ticket__info-item">
                          <Scissors size={18} className="cliente-ticket__info-icon" />
                          <strong className="cliente-ticket__service-title">{reserva.servicio.nombre}</strong>
                        </div>
                      </div>

                      <div className="col-6 col-md-3">
                        <div className="cliente-ticket__info-item">
                          <User size={16} className="cliente-ticket__info-icon" />
                          <span>{reserva.barbero.nombre} {reserva.barbero.apellido}</span>
                        </div>
                      </div>

                      <div className="col-6 col-md-4 text-md-end">
                        <div className="d-flex align-items-center justify-content-md-end gap-1.5 mb-0.5">
                          <Clock3 size={16} className="cliente-ticket__info-icon" />
                          <strong className="fs-6">{reserva.hora} – {reserva.horaFin}</strong>
                        </div>
                        <span className="small text-muted d-block">
                          {formatearFecha(reserva.fecha)}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--portal-card-border)' }}>
                      <Link
                        to={slugActivo ? `/${slugActivo}/reservar` : '/reservar'}
                        state={{
                          reservaId: reserva.id,
                          servicioId: reserva.servicio.id,
                          barberoId: reserva.barbero.id,
                          fecha: reserva.fecha,
                        }}
                        className="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: '8px' }}
                      >
                        Reprogramar turno
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: '8px' }}
                        disabled={cancelarReserva.isPending}
                        onClick={() =>
                          void handleCancelarCita(
                            reserva.id,
                            reserva.servicio.nombre,
                            formatearFecha(reserva.fecha),
                            reserva.hora
                          )
                        }
                      >
                        Cancelar turno
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORIAL DE CITAS */}
            {historialCitas.length > 0 && (
              <div className="mt-5">
                <h3 className="h6 fw-bold text-muted text-uppercase tracking-wider mb-3">
                  Historial de Citas Anteriores
                </h3>
                <div className="d-flex flex-column gap-2">
                  {historialCitas.map((reserva) => (
                    <div key={reserva.id} className="cliente-ticket-card cliente-ticket-card--past">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                          <strong className="d-block">{reserva.servicio.nombre}</strong>
                          <span className="small text-muted">
                            {formatearFecha(reserva.fecha)} a las {reserva.hora} con {reserva.barbero.nombre}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="small font-monospace text-muted">{formatearPrecio(reserva.precio)}</span>
                          <span className={`cliente-ticket__badge-status badge-status--${reserva.estado}`}>
                            {mapearEstado(reserva.estado)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* CONTENIDO PESTAÑA 2: MI WHATSAPP Y CONTACTO */}
        {tabActiva === 'perfil' && (
          <section aria-labelledby="mis-datos-titulo">
            <div className="cliente-portal__form-card">
              <div className="mb-4">
                <h2 id="mis-datos-titulo" className="h4 fw-bold mb-1">
                  Datos de Contacto y Notificaciones
                </h2>
                <p className="small text-muted mb-0">
                  Registra tu número de WhatsApp para recibir automáticamente el comprobante de cita, recordatorios previos y confirmación de cambios.
                </p>
              </div>

              {guardadoExitoso && (
                <div
                  className="alert d-flex align-items-center gap-2 mb-4 rounded-3 small"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    color: '#16a34a',
                  }}
                  role="status"
                >
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <span>Tu número de WhatsApp se guardó exitosamente. Tus próximas citas se notificarán a este número.</span>
                </div>
              )}

              {errorGuardado && (
                <div className="alert alert-danger mb-4 rounded-3 small" role="alert">
                  <ErrorMessage message={errorGuardado} />
                </div>
              )}

              <form onSubmit={handleGuardarTelefono}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-muted">Nombre</label>
                    <div className="input-group">
                      <span className="input-group-text cliente-portal__input-addon">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        className="form-control cliente-portal__form-control"
                        value={perfil?.nombre || sesion?.nombre || ''}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-muted">Apellido</label>
                    <input
                      type="text"
                      className="form-control cliente-portal__form-control"
                      value={perfil?.apellido || sesion?.apellido || ''}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-muted">
                      Correo Electrónico de Google
                    </label>
                    <div className="input-group">
                      <span className="input-group-text cliente-portal__input-addon">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control cliente-portal__form-control"
                        value={perfil?.email || sesion?.email || ''}
                        readOnly
                        disabled
                      />
                      <span
                        className="input-group-text small"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.12)',
                          color: '#16a34a',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                        }}
                      >
                        Verificado
                      </span>
                    </div>
                  </div>

                  <div className="col-12">
                    <label htmlFor="perfil-telefono" className="form-label small fw-semibold">
                      Número de WhatsApp <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text cliente-portal__input-addon">
                        <Phone size={16} style={{ color: 'var(--portal-primary)' }} />
                      </span>
                      <input
                        id="perfil-telefono"
                        type="tel"
                        className="form-control cliente-portal__form-control"
                        placeholder="Ej. 300 123 4567"
                        maxLength={30}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-text small text-muted mt-2">
                      📱 Mantén este número actualizado para que nuestro bot oficial te envíe el recordatorio de cita antes de tu turno.
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top" style={{ borderColor: 'var(--portal-card-border)' }}>
                  <Button
                    type="submit"
                    className="btn-kyrios-save"
                    isLoading={actualizarPerfil.isPending}
                    loadingText="Guardando..."
                  >
                    Guardar WhatsApp
                  </Button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* CONTENIDO PESTAÑA 3: MIS FAVORITOS (VISTA PREPARATORIA) */}
        {tabActiva === 'favoritos' && (
          <section aria-labelledby="favoritos-titulo">
            <div className="cliente-portal__empty-state">
              <Heart size={44} className="opacity-50 mb-3 mx-auto" style={{ color: 'var(--portal-primary)' }} />
              <h2 id="favoritos-titulo" className="h5 fw-bold mb-1">
                Tus Servicios y Barberos Favoritos
              </h2>
              <p className="small text-muted mb-4" style={{ maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                Pronto podrás marcar con un corazón a tus barberos predilectos y cortes frecuentes para agendar con un solo clic.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setSearchParams({ tab: 'citas' })}
              >
                Volver a Mis Citas
              </button>
            </div>
          </section>
        )}

        {/* CONTENIDO PESTAÑA 4: TARJETA DE FIDELIZACIÓN (VISTA PREPARATORIA) */}
        {tabActiva === 'fidelizacion' && (
          <section aria-labelledby="fidelizacion-titulo">
            <div className="cliente-portal__empty-state">
              <Award size={44} className="opacity-50 mb-3 mx-auto" style={{ color: 'var(--portal-primary)' }} />
              <h2 id="fidelizacion-titulo" className="h5 fw-bold mb-1">
                Programa de Puntos y Fidelización
              </h2>
              <p className="small text-muted mb-4" style={{ maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                Estamos preparando tu tarjeta de sellos digital. Muy pronto acumularás cortes para canjear servicios gratuitos y beneficios exclusivos en {effectiveName}.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setSearchParams({ tab: 'citas' })}
              >
                Volver a Mis Citas
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

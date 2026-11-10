import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  Copy,
  MapPin,
  Scissors,
  UserRound,
} from 'lucide-react';
import type { Servicio } from '../../servicios/types/servicios.types';
import type {
  BarberoDisponibleReservaDTO,
  ClienteSesionDTO,
  ReservaCreadaDTO,
} from '../api/reservas.dto';
import type { PasoReserva } from './BookingStepper';
import { reservasService } from '../api/reservas.service';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';

export interface StepConfirmacionProps {
  isLoading: boolean;
  consultaBarberosServicio?: { isLoading?: boolean };
  servicioSeleccionado?: Servicio | null;
  barberoSeleccionado?: BarberoDisponibleReservaDTO | null;
  reservaCreada: ReservaCreadaDTO | null;
  reservaModificada: boolean;
  irAPaso: (pasoDestino: PasoReserva, forzar?: boolean, estadoAdicional?: Record<string, string | null>) => void;
  errorConfirmacion: unknown;
  conflictoReserva: boolean;
  mensajeErrorConfirmacion: (error: unknown) => string;
  volverASeleccionHorario: () => void;
  effectiveName: string;
  reservaId?: number | null;
  copiarCodigoCita: (id: string | number) => void;
  codigoCopiado: boolean;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
  formatearFecha: (fechaIso: string) => string;
  formatearPrecio: (valor: number) => string;
  clienteSesion: ClienteSesionDTO | null;
  nombreInvitado: string;
  setNombreInvitado: (val: string) => void;
  apellidoInvitado: string;
  setApellidoInvitado: (val: string) => void;
  telefonoInvitado: string;
  setTelefonoInvitado: (val: string) => void;
  slugActivo: string;
  limpiarBorradorYReiniciar: () => void;
  cambiarReservaDeInvitado: () => void;
  cambiarBarberoDeInvitado: () => void;
  cancelarMiReserva: { isPending: boolean };
  cancelarReservaDeClienteAutenticado: () => Promise<void> | void;
  cancelarInvitado: { isPending: boolean };
  cancelarReservaDeInvitado: () => Promise<void> | void;
  enviarReserva: (event: FormEvent<HTMLFormElement>) => void;
  errorContacto: string | null;
  crearReserva: { isPending: boolean };
  modificarReserva: { isPending: boolean };
  modificarInvitado: { isPending: boolean };
}

export default function StepConfirmacion({
  isLoading,
  consultaBarberosServicio,
  servicioSeleccionado,
  barberoSeleccionado,
  reservaCreada,
  reservaModificada,
  irAPaso,
  errorConfirmacion,
  conflictoReserva,
  mensajeErrorConfirmacion,
  volverASeleccionHorario,
  effectiveName,
  reservaId,
  copiarCodigoCita,
  codigoCopiado,
  fechaSeleccionada,
  horaSeleccionada,
  formatearFecha,
  formatearPrecio,
  clienteSesion,
  nombreInvitado,
  setNombreInvitado,
  apellidoInvitado,
  setApellidoInvitado,
  telefonoInvitado,
  setTelefonoInvitado,
  slugActivo,
  limpiarBorradorYReiniciar,
  cambiarReservaDeInvitado,
  cambiarBarberoDeInvitado,
  cancelarMiReserva,
  cancelarReservaDeClienteAutenticado,
  cancelarInvitado,
  cancelarReservaDeInvitado,
  enviarReserva,
  errorContacto,
  crearReserva,
  modificarReserva,
  modificarInvitado,
}: StepConfirmacionProps) {
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  if (isLoading || consultaBarberosServicio?.isLoading || !servicioSeleccionado || !barberoSeleccionado) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
        <KyriosSpinner size="md" />
        <span className="small text-surface-muted mt-2">Cargando datos de tu reserva...</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="resumen-reserva-titulo" className="booking-section">
      {/* Cabecera dinámica: si ya se creó o modificó la reserva, muestra confirmación; de lo contrario, muestra revisión */}
      {reservaCreada || reservaModificada ? (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-success text-white px-2 py-1 rounded-pill">
              ✓ Cita confirmada
            </span>
            <h2 id="resumen-reserva-titulo" className="h4 fw-bold mb-0">
              {reservaModificada ? '¡Reserva modificada con éxito!' : '¡Tu reserva ha sido confirmada!'}
            </h2>
          </div>
          <p className="small text-surface-muted mb-0">
            Hemos registrado tu cita en la agenda. A continuación encuentras tu comprobante oficial con todos los detalles.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="booking-step-badge">Paso 4</span>
              <h2 id="resumen-reserva-titulo" className="h4 fw-bold mb-0">
                Resumen de tu reserva
              </h2>
            </div>
            <p className="small text-surface-muted mb-0">Revisa los datos antes de agendar tu cita.</p>
          </div>
          <Button type="button" size="sm" variant="outline-secondary" onClick={() => irAPaso(3)}>
            Modificar fecha u hora
          </Button>
        </div>
      )}

      {Boolean(errorConfirmacion) && (
        <div className="alert alert-warning mb-4" role="alert">
          <ErrorMessage message={mensajeErrorConfirmacion(errorConfirmacion)} />
          {conflictoReserva && (
            <div className="mt-3">
              <p className="small mb-2">
                La franja ya no está disponible. Consulta de nuevo los horarios y elige otro.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline-primary"
                onClick={volverASeleccionHorario}
              >
                Elegir otra hora
              </Button>
            </div>
          )}
        </div>
      )}

      {reservaCreada || reservaModificada ? (
        <div className="booking-confirmed-voucher mb-5">
          {/* Header con marca y sello de confirmación */}
          <div className="booking-voucher__header text-center mb-3">
            <div className="booking-voucher__brand-badge d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2">
              <Scissors size={13} className="text-primary" />
              <span className="font-brand small tracking-wider text-uppercase">{effectiveName}</span>
            </div>

            <div className="booking-voucher__check-ring mx-auto mb-2" aria-hidden="true">
              <Check size={28} strokeWidth={2.8} />
            </div>

            <h3 className="h4 fw-bold mb-1 booking-voucher__title">
              {reservaModificada ? '¡Cita Reprogramada con Éxito!' : '¡Cita Confirmada con Éxito!'}
            </h3>
            <p className="booking-voucher__subtitle text-surface-muted small mb-2">
              Tu turno ha sido asegurado en nuestra agenda oficial.
            </p>

            {/* Código de cita y status amigable */}
            <div className="booking-voucher__code-bar d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border">
              <span className="small text-surface-muted">Código:</span>
              <strong className="booking-voucher__code font-monospace fs-6">
                #{reservaCreada?.id ?? reservaId}
              </strong>
              <button
                type="button"
                className="booking-voucher__copy-btn btn btn-sm p-0 ms-1 text-surface-muted"
                title="Copiar código de cita"
                onClick={() => copiarCodigoCita(reservaCreada?.id ?? reservaId ?? '')}
              >
                {codigoCopiado ? (
                  <span className="badge bg-success text-white py-1">¡Copiado!</span>
                ) : (
                  <Copy size={13} />
                )}
              </button>
              <span className="text-surface-muted opacity-50">·</span>
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small">
                ● Cita Programada
              </span>
            </div>
          </div>

          {/* Tira destacada de Fecha y Hora (Hero Strip) */}
          <div className="booking-voucher__hero-time rounded-4 p-3 my-3 border">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2 gap-sm-3 min-w-0">
                <div className="booking-voucher__calendar-badge flex-shrink-0" aria-hidden="true">
                  <CalendarDays size={20} className="text-primary" />
                </div>
                <div className="text-truncate">
                  <span className="small text-uppercase tracking-wider text-surface-muted d-block" style={{ fontSize: '0.72rem' }}>
                    Fecha de tu cita
                  </span>
                  <strong className="booking-voucher__title fs-6 text-capitalize d-block text-truncate">
                    {fechaSeleccionada ? formatearFecha(fechaSeleccionada) : '—'}
                  </strong>
                </div>
              </div>
              <div className="booking-voucher__time-chip text-end flex-shrink-0">
                <span className="small text-surface-muted d-block" style={{ fontSize: '0.72rem' }}>Hora de atención</span>
                <strong className="fs-4 text-primary font-monospace">{horaSeleccionada ?? '—'}</strong>
              </div>
            </div>
          </div>

          {/* Grid 2x2 compacto de micro-tarjetas en móvil y desktop */}
          <div className="booking-voucher__grid row g-2 g-sm-3 mb-3 mb-md-4">
            {/* Servicio */}
            <div className="col-6">
              <div className="booking-voucher__tile p-2.5 p-sm-3 rounded-3 border h-100">
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <div className="booking-voucher__tile-icon flex-shrink-0" aria-hidden="true">
                    <Scissors size={13} />
                  </div>
                  <span className="booking-voucher__label text-uppercase fw-semibold tracking-wider text-truncate">
                    Servicio
                  </span>
                </div>
                <strong className="booking-voucher__val fs-6 d-block mb-1 text-truncate" title={servicioSeleccionado.nombre}>
                  {servicioSeleccionado.nombre}
                </strong>
                <span className="booking-voucher__meta-badge badge border text-truncate d-inline-block mw-100">
                  ⏱ {servicioSeleccionado.duracionMinutos} min
                </span>
              </div>
            </div>

            {/* Barbero */}
            <div className="col-6">
              <div className="booking-voucher__tile p-2.5 p-sm-3 rounded-3 border h-100">
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <div className="booking-voucher__tile-icon flex-shrink-0" aria-hidden="true">
                    <UserRound size={13} />
                  </div>
                  <span className="booking-voucher__label text-uppercase fw-semibold tracking-wider text-truncate">
                    Barbero
                  </span>
                </div>
                <strong className="booking-voucher__val fs-6 d-block mb-1 text-truncate" title={`${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}`}>
                  {barberoSeleccionado.nombre} {barberoSeleccionado.apellido}
                </strong>
                <span className="booking-voucher__meta-badge badge border text-primary border-primary-subtle text-truncate d-inline-block mw-100">
                  ✂ Especialista
                </span>
              </div>
            </div>

            {/* Total a Pagar */}
            <div className="col-6">
              <div className="booking-voucher__tile p-2.5 p-sm-3 rounded-3 border h-100">
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <span className="booking-voucher__label text-uppercase fw-semibold tracking-wider text-truncate">
                    Total a Pagar
                  </span>
                </div>
                <strong className="fs-5 d-block text-primary fw-bold mb-0.5 text-truncate">
                  {formatearPrecio(servicioSeleccionado.precio)}
                </strong>
                <span className="booking-voucher__subtext small text-surface-muted d-block text-truncate">
                  En recepción
                </span>
              </div>
            </div>

            {/* Cliente */}
            <div className="col-6">
              <div className="booking-voucher__tile p-2.5 p-sm-3 rounded-3 border h-100">
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <span className="booking-voucher__label text-uppercase fw-semibold tracking-wider text-truncate">
                    Titular
                  </span>
                </div>
                <strong className="booking-voucher__val fs-6 d-block mb-0.5 text-truncate" title={clienteSesion ? `${clienteSesion.nombre} ${clienteSesion.apellido ?? ''}` : (nombreInvitado || 'Cliente Invitado')}>
                  {clienteSesion ? `${clienteSesion.nombre} ${clienteSesion.apellido ?? ''}` : (nombreInvitado || 'Cliente Invitado')}
                </strong>
                <span className="booking-voucher__subtext small text-surface-muted d-block text-truncate">
                  📱 {clienteSesion?.email || telefonoInvitado}
                </span>
              </div>
            </div>
          </div>

          {/* Recomendación y Ubicación compacta */}
          <div className="booking-voucher__notice p-2.5 p-sm-3 rounded-3 mb-3 d-flex align-items-center gap-2 gap-sm-3">
            <MapPin size={18} className="text-primary flex-shrink-0" aria-hidden="true" />
            <div className="small">
              <strong className="booking-voucher__title me-1">{effectiveName}:</strong>
              <span className="text-surface-muted">
                Te agradecemos llegar con <strong>5 minutos de anticipación</strong>.
              </span>
            </div>
          </div>

          {/* Perforación estilizada tipo ticket */}
          <div className="booking-voucher__perforation my-3" aria-hidden="true" />

          {/* Botones de Acción con Jerarquía Visual Limpia */}
          <div className="booking-voucher__actions">
            <div className="d-flex flex-wrap justify-content-center gap-2 gap-sm-3 mb-3">
              <Link to={`/${slugActivo}`} className="btn btn-primary px-3 px-sm-4 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-sm-grow-0">
                <ArrowLeft size={16} /> Volver al inicio
              </Link>
              <Button
                type="button"
                variant="outline-secondary"
                className="px-3 px-sm-4 py-2 flex-grow-1 flex-sm-grow-0"
                onClick={limpiarBorradorYReiniciar}
              >
                Agendar otra cita
              </Button>
            </div>

            {/* Gestión de cita (Cambiar / Cancelar) agrupada sutilmente abajo */}
            {clienteSesion && (reservaCreada || reservaModificada) && (
              <div className="booking-voucher__management text-center pt-3 border-top">
                <div
                  className="p-3 rounded-3 border mb-3 text-start"
                  style={{
                    backgroundColor: 'var(--surface-app-bg)',
                    borderColor: 'var(--surface-card-border)',
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Check size={16} className="text-success" />
                    <strong className="small text-surface-primary">Cita asociada a tu cuenta</strong>
                  </div>
                  <p className="small text-surface-muted mb-3" style={{ fontSize: '0.82rem' }}>
                    Esta cita está guardada en tu perfil. Puedes consultarla o cambiarla en cualquier momento desde tu panel personal.
                  </p>
                  <Link
                    to={`/${slugActivo}/cliente/mi-cuenta`}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
                  >
                    <Calendar size={14} /> Ir a Mis Citas
                  </Link>
                </div>

                <span className="small text-surface-muted d-block mb-2">
                  ¿Necesitas realizar algún cambio inmediato en tu cita?
                </span>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={cambiarReservaDeInvitado}
                  >
                    Cambiar fecha u hora
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={cambiarBarberoDeInvitado}
                  >
                    Cambiar barbero
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={cancelarMiReserva.isPending}
                    onClick={() => void cancelarReservaDeClienteAutenticado()}
                  >
                    {cancelarMiReserva.isPending ? 'Cancelando...' : 'Cancelar cita'}
                  </button>
                </div>
              </div>
            )}
            {((reservaCreada && reservaCreada.tokenGestion) || (reservaModificada && reservaId && reservasService.obtenerTokenGestionInvitado(reservaId))) && !clienteSesion && (
              <div className="booking-voucher__management text-center pt-3 border-top">
                {/* Caja destacada con el enlace de autogestión de invitado */}
                <div
                  className="p-3 rounded-3 border mb-3 text-start"
                  style={{
                    backgroundColor: 'var(--surface-app-bg)',
                    borderColor: 'var(--surface-card-border)',
                  }}
                >
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <strong className="small text-surface-primary d-flex align-items-center gap-1.5">
                      🔗 Enlace personal de tu cita:
                    </strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-0.5 px-2.5 d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        const idCita = reservaCreada?.id ?? reservaId;
                        const tokenCita = reservaCreada?.tokenGestion || (reservaId ? reservasService.obtenerTokenGestionInvitado(reservaId) : '');
                        const enlace = `${window.location.origin}/${slugActivo}/c/${idCita}/${tokenCita}`;
                        void navigator.clipboard.writeText(enlace).then(() => {
                          setEnlaceCopiado(true);
                          setTimeout(() => setEnlaceCopiado(false), 2500);
                        });
                      }}
                    >
                      {enlaceCopiado ? (
                        <span className="text-success fw-bold">¡Enlace copiado!</span>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copiar enlace</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    className="small font-monospace p-2 rounded mb-2 text-truncate border"
                    style={{
                      backgroundColor: 'var(--surface-card-bg)',
                      fontSize: '0.78rem',
                      color: 'var(--surface-muted)',
                    }}
                  >
                    {`${window.location.origin}/${slugActivo}/c/${reservaCreada?.id ?? reservaId}/${reservaCreada?.tokenGestion || (reservaId ? reservasService.obtenerTokenGestionInvitado(reservaId) : '')}`}
                  </div>
                  <p className="small text-surface-muted mb-0" style={{ fontSize: '0.78rem' }}>
                    💡 <strong>Consejo:</strong> Guarda este enlace. Con él podrás ver, reprogramar o cancelar tu cita en cualquier momento sin necesidad de registrarte.
                  </p>
                </div>
                <span className="small text-surface-muted d-block mb-2">
                  ¿Necesitas realizar algún cambio en tu cita?
                </span>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={cambiarReservaDeInvitado}
                  >
                    Cambiar fecha u hora
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={cambiarBarberoDeInvitado}
                  >
                    Cambiar barbero
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={cancelarInvitado.isPending}
                    onClick={() => void cancelarReservaDeInvitado()}
                  >
                    {cancelarInvitado.isPending ? 'Cancelando...' : 'Cancelar cita'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="booking-summary-layout row g-4">
          <div className="col-12 col-lg-7">
            <div className="booking-ticket card-surface rounded-4 p-4 mb-4">
              <div className="booking-ticket__header d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div>
                  <span className="font-brand fs-5 tracking-wide text-primary">{effectiveName.toUpperCase()}</span>
                  <span className="small text-surface-muted d-block">Comprobante de Reserva</span>
                </div>
                <Scissors size={22} className="text-primary" />
              </div>

              <div className="booking-ticket__items d-flex flex-column gap-3">
                <div className="booking-ticket__row d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Scissors size={16} className="text-surface-muted" />
                    <span className="text-surface-muted small">Servicio</span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold d-block">{servicioSeleccionado.nombre}</span>
                    <span className="small text-surface-muted">{servicioSeleccionado.duracionMinutos} minutos</span>
                  </div>
                </div>

                <div className="booking-ticket__row d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <UserRound size={16} className="text-surface-muted" />
                    <span className="text-surface-muted small">Barbero</span>
                  </div>
                  <span className="fw-semibold">{barberoSeleccionado.nombre} {barberoSeleccionado.apellido}</span>
                </div>

                <div className="booking-ticket__row d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <CalendarDays size={16} className="text-surface-muted" />
                    <span className="text-surface-muted small">Fecha y Hora</span>
                  </div>
                  <div className="text-end">
                    <span className="fw-semibold d-block text-capitalize">{fechaSeleccionada ? formatearFecha(fechaSeleccionada) : '—'}</span>
                    <span className="badge booking-primary-badge">{horaSeleccionada ?? '—'}</span>
                  </div>
                </div>
              </div>

              <div className="booking-ticket__divider my-3" />

              <div className="booking-ticket__total d-flex justify-content-between align-items-center pt-2">
                <span className="fw-bold">Total a pagar</span>
                <span className="booking-ticket__price h4 fw-bold text-primary mb-0">
                  {formatearPrecio(servicioSeleccionado.precio)}
                </span>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="booking-form-card card-surface rounded-4 p-4">
              <form onSubmit={enviarReserva}>
                {clienteSesion ? (
                  <div className="mb-4">
                    <h3 className="h6 fw-bold mb-2">Cuenta de cliente</h3>
                    <div className="p-3 rounded-3 bg-body-tertiary border">
                      <strong className="d-block">{clienteSesion.nombre} {clienteSesion.apellido ?? ''}</strong>
                      <span className="small text-surface-muted">{clienteSesion.email}</span>
                      <p className="small text-surface-muted mt-2 mb-0">
                        La reserva quedará vinculada automáticamente a tu perfil de cliente.
                      </p>
                    </div>
                  </div>
                ) : !reservaId ? (
                  <div className="mb-4">
                    <h3 className="h6 fw-bold mb-1">Datos de contacto</h3>
                    <p className="small text-surface-muted mb-3">
                      Para notificarte y enviarte el comprobante de tu cita.
                    </p>
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label htmlFor="invitado-nombre" className="form-label small fw-semibold">
                          Nombre <span className="text-danger">*</span>
                        </label>
                        <input
                          id="invitado-nombre"
                          className="form-control"
                          autoComplete="given-name"
                          value={nombreInvitado}
                          maxLength={100}
                          onChange={(event) => setNombreInvitado(event.target.value)}
                          placeholder="Ej. Juan"
                          required
                        />
                        <div className="form-text text-end">{nombreInvitado.length}/100</div>
                      </div>
                      <div>
                        <label htmlFor="invitado-apellido" className="form-label small fw-semibold">
                          Apellido <span className="text-surface-muted fw-normal">(máx. 100)</span>
                        </label>
                        <input
                          id="invitado-apellido"
                          className="form-control"
                          autoComplete="family-name"
                          value={apellidoInvitado}
                          maxLength={100}
                          onChange={(event) => setApellidoInvitado(event.target.value)}
                          placeholder="Ej. Pérez"
                        />
                        <div className="form-text text-end">{apellidoInvitado.length}/100</div>
                      </div>
                      <div>
                        <label htmlFor="invitado-telefono" className="form-label small fw-semibold">
                          Teléfono / WhatsApp <span className="text-danger">*</span>
                        </label>
                        <input
                          id="invitado-telefono"
                          type="tel"
                          className="form-control"
                          autoComplete="tel"
                          value={telefonoInvitado}
                          maxLength={30}
                          onChange={(event) => setTelefonoInvitado(event.target.value)}
                          placeholder="Ej. 300 123 4567"
                          required
                        />
                        <div className="form-text text-end">{telefonoInvitado.length}/30</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 bg-body-tertiary border mb-4">
                    <p className="small text-surface-muted mb-0">
                      La cita se actualizará con los datos de gestión asociados a esta reserva.
                    </p>
                  </div>
                )}

                {errorContacto && <ErrorMessage message={errorContacto} />}

                <div className="d-grid mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="booking-confirm-btn"
                    isLoading={crearReserva.isPending || modificarReserva.isPending || modificarInvitado.isPending}
                    loadingText={reservaId ? 'Guardando cambios...' : 'Confirmando reserva...'}
                    disabled={!fechaSeleccionada || !horaSeleccionada || (Boolean(reservaId) && !clienteSesion && !reservasService.obtenerTokenGestionInvitado(reservaId!))}
                  >
                    {reservaId ? 'Guardar cambios' : 'Confirmar reserva'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


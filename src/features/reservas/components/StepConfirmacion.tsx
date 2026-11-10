import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  Check,
  Copy,
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
  readonly isLoading: boolean;
  readonly consultaBarberosServicio?: { readonly isLoading?: boolean };
  readonly servicioSeleccionado?: Servicio | null;
  readonly barberoSeleccionado?: BarberoDisponibleReservaDTO | null;
  readonly reservaCreada: ReservaCreadaDTO | null;
  readonly reservaModificada: boolean;
  readonly irAPaso: (pasoDestino: PasoReserva, forzar?: boolean, estadoAdicional?: Record<string, string | null>) => void;
  readonly errorConfirmacion: unknown;
  readonly conflictoReserva: boolean;
  readonly mensajeErrorConfirmacion: (error: unknown) => string;
  readonly volverASeleccionHorario: () => void;
  readonly effectiveName: string;
  readonly reservaId?: number | null;
  readonly copiarCodigoCita: (id: string | number) => void;
  readonly codigoCopiado: boolean;
  readonly fechaSeleccionada: string | null;
  readonly horaSeleccionada: string | null;
  readonly formatearFecha: (fechaIso: string) => string;
  readonly formatearPrecio: (valor: number) => string;
  readonly clienteSesion: ClienteSesionDTO | null;
  readonly nombreInvitado: string;
  readonly setNombreInvitado: (val: string) => void;
  readonly apellidoInvitado: string;
  readonly setApellidoInvitado: (val: string) => void;
  readonly telefonoInvitado: string;
  readonly setTelefonoInvitado: (val: string) => void;
  readonly slugActivo: string;
  readonly limpiarBorradorYReiniciar: () => void;
  readonly cambiarReservaDeInvitado: () => void;
  readonly cambiarBarberoDeInvitado: () => void;
  readonly cancelarMiReserva: { readonly isPending: boolean };
  readonly cancelarReservaDeClienteAutenticado: () => Promise<void> | void;
  readonly cancelarInvitado: { readonly isPending: boolean };
  readonly cancelarReservaDeInvitado: () => Promise<void> | void;
  readonly enviarReserva: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly errorContacto: string | null;
  readonly crearReserva: { readonly isPending: boolean };
  readonly modificarReserva: { readonly isPending: boolean };
  readonly modificarInvitado: { readonly isPending: boolean };
}

interface VoucherGestionInvitadoProps {
  readonly slugActivo: string;
  readonly idCita: number | string | null | undefined;
  readonly tokenCita: string | null | undefined;
  readonly cambiarReservaDeInvitado: () => void;
  readonly cambiarBarberoDeInvitado: () => void;
  readonly cancelarInvitado: { readonly isPending: boolean };
  readonly cancelarReservaDeInvitado: () => void | Promise<void>;
}

function VoucherGestionInvitado({
  slugActivo,
  idCita,
  tokenCita,
  cambiarReservaDeInvitado,
  cambiarBarberoDeInvitado,
  cancelarInvitado,
  cancelarReservaDeInvitado,
}: Readonly<VoucherGestionInvitadoProps>) {
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const enlace = `${window.location.origin}/${slugActivo}/c/${idCita ?? ''}/${tokenCita ?? ''}`;

  const copiarEnlace = () => {
    void navigator.clipboard.writeText(enlace).then(() => {
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 3000);
    });
  };

  return (
    <div className="booking-voucher__management text-center pt-3 border-top">
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
            onClick={copiarEnlace}
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
          {enlace}
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
  );
}

/**
 * Subcomponente de Voucher para citas ya confirmadas o modificadas exitosamente
 */
function VoucherConfirmado({
  servicioSeleccionado,
  barberoSeleccionado,
  reservaCreada,
  reservaModificada,
  irAPaso,
  effectiveName,
  reservaId,
  copiarCodigoCita,
  codigoCopiado,
  fechaSeleccionada,
  horaSeleccionada,
  formatearFecha,
  formatearPrecio,
  clienteSesion,
  slugActivo,
  limpiarBorradorYReiniciar,
  cambiarReservaDeInvitado,
  cambiarBarberoDeInvitado,
  cancelarMiReserva,
  cancelarReservaDeClienteAutenticado,
  cancelarInvitado,
  cancelarReservaDeInvitado,
}: Readonly<StepConfirmacionProps>) {
  if (!servicioSeleccionado || !barberoSeleccionado) return null;

  const idCita = reservaCreada?.id ?? reservaId;
  const tokenCita = reservaCreada?.tokenGestion || (reservaId ? reservasService.obtenerTokenGestionInvitado(reservaId) : '');
  const tieneGestionInvitado = Boolean(
    (reservaCreada?.tokenGestion || (reservaModificada && reservaId && reservasService.obtenerTokenGestionInvitado(reservaId))) &&
    !clienteSesion
  );

  const fechaMostrar = reservaCreada?.fecha ?? fechaSeleccionada;
  const fechaTexto = fechaMostrar ? formatearFecha(fechaMostrar) : '—';
  const horaTexto = reservaCreada?.hora ?? horaSeleccionada ?? '—';

  return (
    <>
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
          Guarda este comprobante. Te hemos asignado tu turno en la agenda oficial.
        </p>
      </div>

      <div className="booking-voucher-container card card-surface border-0 shadow-lg p-0 overflow-hidden mx-auto" style={{ maxWidth: '640px' }}>
        <div className="booking-voucher__top bg-primary text-white p-4 text-center position-relative">
          <div className="booking-voucher__check-circle mx-auto mb-2 d-flex align-items-center justify-content-center bg-white text-primary rounded-circle shadow-sm" style={{ width: '56px', height: '56px' }}>
            <Check size={32} strokeWidth={2.5} />
          </div>
          <h3 className="h5 fw-bold mb-1 font-brand">{effectiveName.toUpperCase()}</h3>
          <span className="badge bg-white text-primary px-3 py-1 rounded-pill fw-bold">
            {reservaModificada ? 'CITA REPROGRAMADA' : 'CITA CONFIRMADA'}
          </span>
        </div>

        <div className="booking-voucher__body p-4">
          {(reservaCreada?.id || reservaId) && (
            <div className="booking-voucher__code-box text-center p-3 mb-4 rounded-3 border bg-body-tertiary">
              <span className="text-surface-muted small d-block mb-1 text-uppercase tracking-wider">Código de Reserva</span>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="h3 fw-bold font-monospace text-primary mb-0">
                  #{reservaCreada?.id ?? reservaId}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                  onClick={() => copiarCodigoCita(reservaCreada?.id ?? reservaId!)}
                  title="Copiar código de cita"
                >
                  {codigoCopiado ? (
                    <>
                      <Check size={14} className="text-success" />
                      <span className="small text-success fw-bold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className="small">Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="booking-voucher__grid row g-3 mb-4">
            <div className="col-12 col-sm-6">
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-2 bg-body-tertiary h-100">
                <Scissors size={18} className="text-primary mt-1 flex-shrink-0" />
                <div>
                  <span className="small text-surface-muted d-block">Servicio</span>
                  <strong className="d-block">{servicioSeleccionado.nombre}</strong>
                  <span className="small text-surface-muted">{servicioSeleccionado.duracionMinutos} min</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-2 bg-body-tertiary h-100">
                <UserRound size={18} className="text-primary mt-1 flex-shrink-0" />
                <div>
                  <span className="small text-surface-muted d-block">Barbero Asignado</span>
                  <strong className="d-block">{barberoSeleccionado.nombre} {barberoSeleccionado.apellido}</strong>
                  <span className="small text-surface-muted">Profesional</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-2 bg-body-tertiary h-100">
                <Calendar size={18} className="text-primary mt-1 flex-shrink-0" />
                <div>
                  <span className="small text-surface-muted d-block">Fecha</span>
                  <strong className="d-block text-capitalize">
                    {fechaTexto}
                  </strong>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-2 bg-body-tertiary h-100">
                <CalendarDays size={18} className="text-primary mt-1 flex-shrink-0" />
                <div>
                  <span className="small text-surface-muted d-block">Hora</span>
                  <strong className="d-block text-primary fs-5">
                    {horaTexto}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="booking-voucher__price-row d-flex justify-content-between align-items-center py-3 border-top border-bottom mb-4">
            <span className="fw-semibold">Total del servicio</span>
            <span className="h4 fw-bold text-primary mb-0">
              {formatearPrecio(servicioSeleccionado.precio)}
            </span>
          </div>

          <div className="booking-voucher__actions d-flex flex-column gap-2 mb-3">
            <button
              type="button"
              className="btn btn-primary w-100 py-2.5 fw-bold"
              onClick={limpiarBorradorYReiniciar}
            >
              Hacer otra reserva
            </button>

            {clienteSesion ? (
              <div className="d-flex flex-column gap-2">
                <Link
                  to={`/${slugActivo}/cliente/mi-cuenta`}
                  className="btn btn-outline-secondary w-100 py-2 text-decoration-none text-center"
                >
                  Ver en mi historial de citas
                </Link>
                <div className="d-flex justify-content-center gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => irAPaso(3)}
                  >
                    Reprogramar fecha u hora
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
            ) : (
              <Link
                to={`/${slugActivo}/catalogo/servicios`}
                className="btn btn-outline-secondary w-100 py-2 text-decoration-none text-center"
              >
                Volver al catálogo
              </Link>
            )}
          </div>

          {tieneGestionInvitado && (
            <VoucherGestionInvitado
              slugActivo={slugActivo}
              idCita={idCita}
              tokenCita={tokenCita}
              cambiarReservaDeInvitado={cambiarReservaDeInvitado}
              cambiarBarberoDeInvitado={cambiarBarberoDeInvitado}
              cancelarInvitado={cancelarInvitado}
              cancelarReservaDeInvitado={cancelarReservaDeInvitado}
            />
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Subcomponente de Formulario de Revisión y Envío de Cita
 */
function FormularioRevisionReserva({
  servicioSeleccionado,
  barberoSeleccionado,
  errorConfirmacion,
  conflictoReserva,
  mensajeErrorConfirmacion,
  volverASeleccionHorario,
  effectiveName,
  reservaId,
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
  enviarReserva,
  errorContacto,
  crearReserva,
  modificarReserva,
  modificarInvitado,
}: Readonly<StepConfirmacionProps>) {
  if (!servicioSeleccionado || !barberoSeleccionado) return null;

  const renderSeccionContacto = () => {
    if (clienteSesion) {
      return (
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
      );
    }

    if (!reservaId) {
      return (
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
      );
    }

    return (
      <div className="p-3 rounded-3 bg-body-tertiary border mb-4">
        <p className="small text-surface-muted mb-0">
          La cita se actualizará con los datos de gestión asociados a esta reserva.
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="booking-step-badge">Paso 4</span>
          <h2 id="resumen-reserva-titulo" className="h4 fw-bold mb-0">
            {reservaId ? 'Confirmar cambio de fecha/hora' : 'Revisa y confirma tu cita'}
          </h2>
        </div>
        <p className="small text-surface-muted mb-0">
          Verifica los datos seleccionados antes de enviar tu confirmación.
        </p>
      </div>

      {Boolean(errorConfirmacion) && (
        <div className="alert alert-danger mb-4" role="alert">
          <ErrorMessage message={mensajeErrorConfirmacion(errorConfirmacion)} />
          {conflictoReserva && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={volverASeleccionHorario}
            >
              Seleccionar otro horario
            </button>
          )}
        </div>
      )}

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
              {renderSeccionContacto()}

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
    </>
  );
}

export default function StepConfirmacion(props: Readonly<StepConfirmacionProps>) {
  if (props.isLoading || props.consultaBarberosServicio?.isLoading || !props.servicioSeleccionado || !props.barberoSeleccionado) {
    return (
      <output className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
        <KyriosSpinner size="md" />
        <span className="small text-surface-muted mt-2">Cargando datos de tu reserva...</span>
      </output>
    );
  }

  const citaConfirmada = Boolean(props.reservaCreada || props.reservaModificada);

  return (
    <section aria-labelledby="resumen-reserva-titulo" className="booking-section">
      {citaConfirmada ? (
        <VoucherConfirmado {...props} />
      ) : (
        <FormularioRevisionReserva {...props} />
      )}
    </section>
  );
}

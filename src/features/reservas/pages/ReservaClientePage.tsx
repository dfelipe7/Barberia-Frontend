import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Check, Clock3, Scissors, UserRound } from 'lucide-react';
import { useServiciosCatalogo } from '../../servicios/api/servicios.facade';
import type { Servicio } from '../../servicios/types/servicios.types';
import { useCrearReserva, useDisponibilidadReserva } from '../api/reservas.facade';
import type { FiltroDisponibilidadReservaDTO } from '../api/reservas.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';

interface ReservaLocationState {
  servicioId?: number;
  barberoId?: number;
}

const aFechaISO = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(anio, mes - 1, dia, 12));
};

const formatearPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

const crearVentanaDisponibilidad = () => {
  const inicio = new Date();
  inicio.setHours(12, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 30);
  return { fechaInicio: aFechaISO(inicio), fechaFin: aFechaISO(fin) };
};

const mensajeErrorConfirmacion = (error: unknown) => {
  if (!isAxiosError(error)) return mapApiError(error);

  const userMessage = (error as typeof error & { userMessage?: string }).userMessage;
  if (userMessage) return userMessage;

  const mensajeBackend = (error.response?.data as { mensaje?: string } | undefined)?.mensaje;
  if (mensajeBackend) return mensajeBackend;

  if (error.response?.status === 409) {
    return 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario.';
  }

  return mapApiError(error);
};

export const ReservaClientePage = () => {
  const location = useLocation();
  const initialState = (location.state ?? {}) as ReservaLocationState;
  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();
  const crearReserva = useCrearReserva();
  const ventana = useMemo(crearVentanaDisponibilidad, []);
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [servicioId, setServicioId] = useState<number | null>(
    initialState.servicioId ?? null
  );
  const [barberoId, setBarberoId] = useState<number | null>(
    initialState.barberoId ?? null
  );
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [reservaCreada, setReservaCreada] = useState<{ id: number | string; mensaje?: string } | null>(null);

  const serviciosActivos = servicios.filter(
    (servicio) =>
      servicio.estado === 'ACTIVO' &&
      (!initialState.barberoId ||
        servicio.barberos.some((barbero) => barbero.id === initialState.barberoId))
  );
  const servicioSeleccionado = serviciosActivos.find(
    (servicio) => servicio.id === servicioId
  );
  const barberoSeleccionado = servicioSeleccionado?.barberos.find(
    (barbero) => barbero.id === barberoId
  );

  const filtroDisponibilidad: FiltroDisponibilidadReservaDTO | undefined =
    paso === 3 && servicioSeleccionado && barberoSeleccionado
      ? {
          servicioId: servicioSeleccionado.id,
          barberoId: barberoSeleccionado.id,
          ...ventana,
        }
      : undefined;
  const disponibilidad = useDisponibilidadReserva(filtroDisponibilidad);
  const diasDisponibles = disponibilidad.data?.dias ?? [];
  const diaSeleccionado = diasDisponibles.find(
    (dia) => dia.fecha === fechaSeleccionada
  );

  const cambiarServicio = (servicio: Servicio) => {
    setServicioId(servicio.id);
    setBarberoId(
      servicio.barberos.some((barbero) => barbero.id === initialState.barberoId)
        ? (initialState.barberoId ?? null)
        : null
    );
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
  };

  const continuarABarberos = () => {
    if (!servicioSeleccionado) return;
    setBarberoId((actual) =>
      servicioSeleccionado.barberos.some((barbero) => barbero.id === actual)
        ? actual
        : null
    );
    setPaso(2);
  };

  const continuarADisponibilidad = () => {
    if (!barberoSeleccionado) return;
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
    setPaso(3);
  };

  const confirmarReserva = async () => {
    if (!servicioSeleccionado || !barberoSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      return;
    }

    try {
      const resultado = await crearReserva.mutateAsync({
        servicioId: servicioSeleccionado.id,
        barberoId: barberoSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
      });
      setReservaCreada(resultado);
    } catch {
      // El error de API se muestra en el paso de confirmación.
    }
  };

  return (
    <main className="container py-4 py-lg-5" style={{ maxWidth: '1080px' }}>
      <header className="mb-4">
        <span className="text-eyebrow d-block mb-2">RESERVAS / NUEVA CITA</span>
        <h1 className="h2 fw-bold mb-1">Reserva tu cita</h1>
        <p className="text-surface-muted mb-0">
          Selecciona un servicio, el barbero y una fecha con horario disponible.
        </p>
      </header>

      <nav aria-label="Pasos de la reserva" className="mb-4">
        <ol className="list-unstyled d-flex flex-wrap gap-2 mb-0">
          {[
            { numero: 1, label: 'Servicio', icono: <Scissors size={15} /> },
            { numero: 2, label: 'Barbero', icono: <UserRound size={15} /> },
            { numero: 3, label: 'Fecha y hora', icono: <CalendarDays size={15} /> },
            { numero: 4, label: 'Confirmar', icono: <Check size={15} /> },
          ].map((item) => (
            <li
              key={item.numero}
              className={`badge rounded-pill border d-inline-flex align-items-center gap-2 px-3 py-2 ${
                paso === item.numero
                  ? 'text-bg-dark border-dark'
                  : paso > item.numero
                    ? 'text-bg-success border-success'
                    : 'text-bg-light text-surface-muted'
              }`}
              aria-current={paso === item.numero ? 'step' : undefined}
            >
              {paso > item.numero ? <Check size={15} /> : item.icono}
              Paso {item.numero}: {item.label}
            </li>
          ))}
        </ol>
      </nav>

      {paso === 1 && (
        <section aria-labelledby="seleccionar-servicio-titulo">
          <div className="mb-3">
            <h2 id="seleccionar-servicio-titulo" className="h5 fw-bold mb-1">
              1. Elige un servicio
            </h2>
            <p className="small text-surface-muted mb-0">
              Cada opción muestra su descripción, duración y precio.
            </p>
          </div>

          {isLoading && (
            <div className="d-flex justify-content-center py-5" role="status">
              <KyriosSpinner size="md" mensaje="Cargando servicios..." />
            </div>
          )}

          {error && (
            <div className="alert alert-warning">
              <ErrorMessage message={mapApiError(error)} />
              <button
                type="button"
                className="btn btn-sm btn-outline-warning mt-2"
                onClick={() => void refetch()}
                disabled={isLoading}
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !error && serviciosActivos.length === 0 && (
            <p className="alert alert-light border mb-0">
              No hay servicios disponibles para reservar en este momento.
            </p>
          )}

          {!isLoading && !error && serviciosActivos.length > 0 && (
            <div className="row g-3">
              {serviciosActivos.map((servicio) => {
                const foto = obtenerUrlFoto(servicio.fotoUrl);
                const seleccionado = servicio.id === servicioId;
                return (
                  <div className="col-12 col-md-6" key={servicio.id}>
                    <button
                      type="button"
                      className={`card card-surface border w-100 h-100 text-start p-0 overflow-hidden ${
                        seleccionado ? 'border-primary shadow-sm' : ''
                      }`}
                      aria-pressed={seleccionado}
                      onClick={() => cambiarServicio(servicio)}
                    >
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          className="w-100 object-fit-cover"
                          style={{ height: '170px' }}
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="d-flex align-items-center justify-content-center bg-body-secondary"
                          style={{ height: '100px' }}
                          aria-hidden="true"
                        >
                          <Scissors size={28} className="text-surface-muted" />
                        </span>
                      )}
                      <span className="card-body d-flex flex-column">
                        <span className="d-flex justify-content-between align-items-start gap-2">
                          <span className="h6 fw-bold mb-1">{servicio.nombre}</span>
                          {seleccionado && (
                            <span className="badge text-bg-primary">Seleccionado</span>
                          )}
                        </span>
                        <span className="small text-surface-muted flex-grow-1">
                          {servicio.descripcion || 'Servicio profesional de barbería.'}
                        </span>
                        <span className="d-flex flex-wrap gap-3 mt-3 small">
                          <span className="fw-semibold">{formatearPrecio(servicio.precio)}</span>
                          <span className="text-surface-muted d-inline-flex align-items-center gap-1">
                            <Clock3 size={14} aria-hidden="true" />
                            {servicio.duracionMinutos} min
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <Button
              type="button"
              disabled={!servicioSeleccionado}
              onClick={continuarABarberos}
            >
              Continuar con este servicio
            </Button>
          </div>
        </section>
      )}

      {paso === 2 && servicioSeleccionado && (
        <section aria-labelledby="seleccionar-barbero-titulo">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 id="seleccionar-barbero-titulo" className="h5 fw-bold mb-1">
                2. Elige un barbero
              </h2>
              <p className="small text-surface-muted mb-0">
                Barberos habilitados para {servicioSeleccionado.nombre}.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              onClick={() => setPaso(1)}
            >
              Cambiar servicio
            </Button>
          </div>

          {servicioSeleccionado.barberos.length === 0 ? (
            <p className="alert alert-light border mb-0">
              No hay barberos disponibles para este servicio.
            </p>
          ) : (
            <div className="row g-3">
              {servicioSeleccionado.barberos.map((barbero) => {
                const seleccionado = barbero.id === barberoId;
                const foto = obtenerUrlFoto(barbero.fotoUrl);
                const nombre = `${barbero.nombre} ${barbero.apellido}`.trim();
                return (
                  <div className="col-12 col-sm-6 col-lg-4" key={barbero.id}>
                    <button
                      type="button"
                      className={`card card-surface border w-100 h-100 text-center p-3 ${
                        seleccionado ? 'border-primary shadow-sm' : ''
                      }`}
                      aria-pressed={seleccionado}
                      onClick={() => {
                        setBarberoId(barbero.id);
                        setFechaSeleccionada(null);
                        setHoraSeleccionada(null);
                      }}
                    >
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          className="rounded-circle object-fit-cover mx-auto mb-3"
                          style={{ width: '88px', height: '88px' }}
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{ width: '88px', height: '88px' }}
                          aria-hidden="true"
                        >
                          <UserRound size={34} className="text-surface-muted" />
                        </span>
                      )}
                      <span className="fw-semibold">{nombre}</span>
                      {seleccionado && (
                        <span className="badge text-bg-primary mx-auto mt-2">Seleccionado</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <Button
              type="button"
              disabled={!barberoSeleccionado}
              onClick={continuarADisponibilidad}
            >
              Continuar a fecha y hora
            </Button>
          </div>
        </section>
      )}

      {paso === 3 && servicioSeleccionado && barberoSeleccionado && (
        <section aria-labelledby="seleccionar-fecha-titulo">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 id="seleccionar-fecha-titulo" className="h5 fw-bold mb-1">
                3. Elige fecha y hora
              </h2>
              <p className="small text-surface-muted mb-0">
                Próximos 30 días con horarios disponibles para {barberoSeleccionado.nombre}.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              onClick={() => setPaso(2)}
            >
              Cambiar barbero
            </Button>
          </div>

          {disponibilidad.isLoading && (
            <div className="d-flex justify-content-center py-5" role="status">
              <KyriosSpinner size="md" mensaje="Consultando fechas disponibles..." />
            </div>
          )}

          {disponibilidad.error && (
            <div className="alert alert-warning">
              <ErrorMessage message={mapApiError(disponibilidad.error)} />
              <button
                type="button"
                className="btn btn-sm btn-outline-warning mt-2"
                onClick={() => void disponibilidad.refetch()}
                disabled={disponibilidad.isFetching}
              >
                Reintentar
              </button>
            </div>
          )}

          {!disponibilidad.isLoading &&
            !disponibilidad.error &&
            diasDisponibles.length === 0 && (
              <p className="alert alert-light border mb-0">
                No hay horarios disponibles para la fecha seleccionada.
              </p>
            )}

          {!disponibilidad.isLoading && !disponibilidad.error && diasDisponibles.length > 0 && (
            <>
              <h3 className="h6 fw-bold mb-2">Fechas disponibles</h3>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {diasDisponibles.map((dia) => {
                  const seleccionado = dia.fecha === fechaSeleccionada;
                  return (
                    <button
                      key={dia.fecha}
                      type="button"
                      className={`btn rounded-3 border ${
                        seleccionado ? 'btn-dark border-dark' : 'btn-outline-secondary'
                      }`}
                      aria-pressed={seleccionado}
                      onClick={() => {
                        setFechaSeleccionada(dia.fecha);
                        setHoraSeleccionada(null);
                      }}
                    >
                      {formatearFecha(dia.fecha)}
                    </button>
                  );
                })}
              </div>

              {diaSeleccionado && (
                <div aria-live="polite">
                  <h3 className="h6 fw-bold mb-2">
                    Horas disponibles para {formatearFecha(diaSeleccionado.fecha)}
                  </h3>
                  {diaSeleccionado.horariosDisponibles.length === 0 ? (
                    <p className="small text-surface-muted">
                      No hay horarios disponibles para la fecha seleccionada.
                    </p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {diaSeleccionado.horariosDisponibles.map((hora) => (
                        <button
                          key={hora}
                          type="button"
                          className={`btn rounded-pill ${
                            hora === horaSeleccionada ? 'btn-primary' : 'btn-outline-primary'
                          }`}
                          aria-pressed={hora === horaSeleccionada}
                          onClick={() => setHoraSeleccionada(hora)}
                        >
                          {hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="button"
                  disabled={!fechaSeleccionada || !horaSeleccionada}
                  onClick={() => setPaso(4)}
                >
                  Continuar al resumen
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {paso === 4 && servicioSeleccionado && barberoSeleccionado && (
        <section aria-labelledby="resumen-reserva-titulo">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 id="resumen-reserva-titulo" className="h5 fw-bold mb-1">
                Resumen de reserva
              </h2>
              <p className="small text-surface-muted mb-0">
                Revisa los datos antes de confirmar.
              </p>
            </div>
            {!reservaCreada && (
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                onClick={() => setPaso(3)}
              >
                Modificar
              </Button>
            )}
          </div>

          {crearReserva.error && (
            <div className="alert alert-warning" role="alert">
              <ErrorMessage message={mensajeErrorConfirmacion(crearReserva.error)} />
            </div>
          )}

          {reservaCreada ? (
            <div className="alert alert-success" role="status">
              <h3 className="h6 fw-bold mb-1">
                {reservaCreada.mensaje || 'Reserva creada exitosamente'}
              </h3>
              <p className="mb-1">
                {servicioSeleccionado.nombre} con {barberoSeleccionado.nombre}{' '}
                {barberoSeleccionado.apellido}, {fechaSeleccionada && formatearFecha(fechaSeleccionada)}
                {horaSeleccionada ? ` a las ${horaSeleccionada}` : ''}.
              </p>
              <p className="small mb-0">
                Identificador de reserva: <strong>{reservaCreada.id}</strong>
              </p>
            </div>
          ) : (
            <>
              <dl className="row g-3 mb-4 p-3 rounded border bg-body-tertiary">
                <dt className="col-sm-4 text-surface-muted">Servicio</dt>
                <dd className="col-sm-8 fw-semibold">{servicioSeleccionado.nombre}</dd>
                <dt className="col-sm-4 text-surface-muted">Barbero</dt>
                <dd className="col-sm-8 fw-semibold">
                  {barberoSeleccionado.nombre} {barberoSeleccionado.apellido}
                </dd>
                <dt className="col-sm-4 text-surface-muted">Fecha</dt>
                <dd className="col-sm-8 fw-semibold">
                  {fechaSeleccionada ? formatearFecha(fechaSeleccionada) : '—'}
                </dd>
                <dt className="col-sm-4 text-surface-muted">Hora</dt>
                <dd className="col-sm-8 fw-semibold">{horaSeleccionada ?? '—'}</dd>
                <dt className="col-sm-4 text-surface-muted">Duración</dt>
                <dd className="col-sm-8 fw-semibold">
                  {servicioSeleccionado.duracionMinutos} minutos
                </dd>
                <dt className="col-sm-4 text-surface-muted">Precio</dt>
                <dd className="col-sm-8 fw-semibold mb-0">
                  {formatearPrecio(servicioSeleccionado.precio)}
                </dd>
              </dl>

              <div className="d-flex justify-content-end">
                <Button
                  type="button"
                  isLoading={crearReserva.isPending}
                  loadingText="Confirmando reserva..."
                  disabled={!fechaSeleccionada || !horaSeleccionada}
                  onClick={() => void confirmarReserva()}
                >
                  Confirmar reserva
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {paso > 1 && (
        <div className="mt-4 pt-3 border-top small text-surface-muted">
          <span className="fw-semibold">Tu selección:</span>{' '}
          {servicioSeleccionado?.nombre ?? 'elige un servicio'}
          {barberoSeleccionado ? ` · ${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}` : ''}
          {fechaSeleccionada ? ` · ${formatearFecha(fechaSeleccionada)}` : ''}
          {horaSeleccionada ? ` · ${horaSeleccionada}` : ''}
        </div>
      )}
    </main>
  );
};

export default ReservaClientePage;

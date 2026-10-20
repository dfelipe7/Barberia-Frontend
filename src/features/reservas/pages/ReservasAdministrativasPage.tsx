import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock3, RotateCw, Scissors, UserRound } from 'lucide-react';
import type {
  EstadoReservaDTO,
  FiltroReservasAdministrativasDTO,
  ReservaAdministrativaDTO,
} from '../api/reservas.dto';
import {
  useCancelarReservaAdministrativa,
  useDetalleReservaAdministrativa,
  useDisponibilidadReserva,
  useModificarReservaAdministrativa,
  useReservasAdministrativas,
} from '../api/reservas.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import './ReservasAdministrativasPage.css';

const estados: Record<EstadoReservaDTO, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

const hoyISO = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
};

const fechaEnTreintaDias = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 30);
  return hoyISO(fecha);
};

const precioCOP = (precio: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

const fechaLegible = (fecha: string) => {
  const partes = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(partes[0], partes[1] - 1, partes[2], 12));
};

function EditorFechaReserva({
  reserva,
  onCancelar,
  onGuardar,
  guardando,
}: {
  reserva: ReservaAdministrativaDTO;
  onCancelar: () => void;
  onGuardar: (fecha: string, hora: string) => void;
  guardando: boolean;
}) {
  const [fecha, setFecha] = useState(reserva.fecha);
  const [hora, setHora] = useState<string | null>(null);
  const disponibilidad = useDisponibilidadReserva(fecha ? {
    servicioId: reserva.servicio.id,
    barberoId: reserva.barbero.id,
    fecha,
  } : undefined);
  const horas = disponibilidad.data?.slots.filter((slot) => slot.available) ?? [];

  return (
    <div className="border rounded-3 p-3 mt-3">
      <h3 className="h6 fw-bold">Cambiar fecha u hora</h3>
      <p className="small text-surface-muted">Se conserva el servicio y el barbero actual.</p>
      <label className="form-label small fw-semibold" htmlFor="fecha-cambio-reserva">Nueva fecha</label>
      <input
        id="fecha-cambio-reserva"
        type="date"
        className="form-control mb-3"
        min={hoyISO()}
        max={fechaEnTreintaDias()}
        value={fecha}
        onChange={(event) => {
          setFecha(event.target.value);
          setHora(null);
        }}
      />

      {!fecha ? (
        <p className="small text-surface-muted">Selecciona una fecha para consultar horarios.</p>
      ) : disponibilidad.isLoading ? (
        <p className="small text-surface-muted" role="status">Consultando horarios...</p>
      ) : disponibilidad.isError ? (
        <div>
          <ErrorMessage message={mapApiError(disponibilidad.error)} />
          <Button type="button" size="sm" variant="outline-secondary" onClick={() => void disponibilidad.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : horas.length === 0 ? (
        <p className="small text-surface-muted">No hay horarios libres para ese día.</p>
      ) : (
        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Horarios libres">
          {horas.map((slot) => (
            <button
              key={slot.startTime}
              type="button"
              className={'btn ' + (hora === slot.startTime ? 'btn-primary' : 'btn-outline-primary')}
              aria-pressed={hora === slot.startTime}
              onClick={() => setHora(slot.startTime)}
            >
              {slot.startTime}–{slot.endTime}
            </button>
          ))}
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-end gap-2">
        <Button type="button" variant="outline-secondary" onClick={onCancelar}>Volver</Button>
        <Button
          type="button"
          disabled={!fecha || !hora}
          isLoading={guardando}
          loadingText="Guardando..."
          onClick={() => hora && onGuardar(fecha, hora)}
        >
          Guardar cambio
        </Button>
      </div>
    </div>
  );
}

export default function ReservasAdministrativasPage() {
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(fechaEnTreintaDias());
  const [estado, setEstado] = useState<EstadoReservaDTO | ''>('');
  const [barberoId, setBarberoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroReservasAdministrativasDTO>({
    desde: hoyISO(),
    hasta: fechaEnTreintaDias(),
  });
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);

  const listado = useReservasAdministrativas(filtroAplicado);
  const detalle = useDetalleReservaAdministrativa(reservaSeleccionadaId);
  const cancelarReserva = useCancelarReservaAdministrativa();
  const modificarReserva = useModificarReservaAdministrativa();
  const reservas = listado.data ?? [];
  const reservaActiva = detalle.data;
  const filtroInvalido =
    !desde ||
    !hasta ||
    desde > hasta ||
    [barberoId, clienteId].some((id) => id !== '' && (
      !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2_147_483_647
    ));

  const rango = useMemo(() => {
    if (!filtroAplicado.desde && !filtroAplicado.hasta) return 'Todas las fechas';
    if (filtroAplicado.desde && filtroAplicado.hasta) {
      return fechaLegible(filtroAplicado.desde) + ' – ' + fechaLegible(filtroAplicado.hasta);
    }
    return filtroAplicado.desde ? 'Desde ' + fechaLegible(filtroAplicado.desde) : 'Hasta ' + fechaLegible(filtroAplicado.hasta!);
  }, [filtroAplicado]);

  const aplicarFiltros = () => {
    if (filtroInvalido) return;
    const filtros: FiltroReservasAdministrativasDTO = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (estado) filtros.estado = estado;
    if (barberoId) filtros.barberoId = Number(barberoId);
    if (clienteId) filtros.clienteId = Number(clienteId);
    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado(filtros);
  };

  const cancelar = async () => {
    if (!reservaActiva || !window.confirm('¿Quieres cancelar esta reserva?')) return;
    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = await cancelarReserva.mutateAsync(reservaActiva.id);
      setMensajeAccion(resultado.mensaje);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      setErrorAccion(mapApiError(error));
    }
  };

  const guardarCambio = async (fecha: string, hora: string) => {
    if (!reservaActiva) return;
    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = await modificarReserva.mutateAsync({
        id: reservaActiva.id,
        datos: { barberoId: reservaActiva.barbero.id, fecha, hora },
      });
      setMensajeAccion(resultado.mensaje);
      setEditando(false);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      setErrorAccion(mapApiError(error));
    }
  };

  const seleccionarReserva = (id: number) => {
    setReservaSeleccionadaId(id);
    setEditando(false);
    setErrorAccion(null);
    setMensajeAccion(null);
  };

  const estadoFinal = reservaActiva
    ? reservaActiva.estado === 'COMPLETED' || reservaActiva.estado === 'CANCELLED' || reservaActiva.estado === 'NO_SHOW' || reservaActiva.estado === 'IN_PROGRESS'
    : true;

  return (
    <main className="container-fluid p-3 p-md-4 reservations-admin">
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">GESTIÓN / AGENDA GENERAL</span>
          <h1 className="h2 fw-bold mb-1">Reservas de la barbería</h1>
          <p className="text-surface-muted mb-0">Consulta, reprograma y actualiza las citas de todos los barberos.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <BackLink to="/dashboard">Volver al panel</BackLink>
          <Link className="btn btn-primary d-inline-flex align-items-center gap-2" to="/reservas/nueva">
            <Scissors size={16} aria-hidden="true" /> Nueva reserva
          </Link>
        </div>
      </header>

      <section className="card card-surface border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Filtrar reservas</h2>
              <p className="small text-surface-muted mb-0">Elige fechas, estado o identificadores para acotar los resultados.</p>
            </div>
            <span className="small text-surface-muted">{rango}</span>
          </div>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-desde">Desde</label>
              <input id="admin-reservas-desde" type="date" className="form-control" value={desde} onChange={(event) => setDesde(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-hasta">Hasta</label>
              <input id="admin-reservas-hasta" type="date" className="form-control" value={hasta} onChange={(event) => setHasta(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-estado">Estado</label>
              <select id="admin-reservas-estado" className="form-select" value={estado} onChange={(event) => setEstado(event.target.value as EstadoReservaDTO | '')}>
                <option value="">Todos</option>
                {Object.entries(estados).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-barbero">ID del barbero</label>
              <input id="admin-reservas-barbero" type="number" min="1" max="2147483647" step="1" className="form-control" value={barberoId} onChange={(event) => setBarberoId(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-cliente">ID del cliente</label>
              <input id="admin-reservas-cliente" type="number" min="1" max="2147483647" step="1" className="form-control" value={clienteId} onChange={(event) => setClienteId(event.target.value)} />
            </div>
            <div className="col-12 col-sm-6 col-xl-2">
              <Button type="button" className="w-100" disabled={filtroInvalido} onClick={aplicarFiltros}>Aplicar</Button>
            </div>
          </div>
          {filtroInvalido && <p className="small text-danger mt-2 mb-0">Revisa las fechas y usa identificadores enteros positivos.</p>}
        </div>
      </section>

      <div className="row g-4">
        <section className="col-12 col-xl-7" aria-labelledby="admin-listado-titulo">
          <div className="card card-surface border-0 shadow-sm h-100">
            <div className="card-body p-3 p-lg-4">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <span className="text-eyebrow">RESULTADOS</span>
                  <h2 id="admin-listado-titulo" className="h5 fw-bold mb-0">Citas encontradas</h2>
                </div>
                <Button type="button" size="sm" variant="outline-secondary" isLoading={listado.isFetching} onClick={() => void listado.refetch()} icon={<RotateCw size={15} />}>
                  Actualizar
                </Button>
              </div>

              {listado.isError && <ErrorMessage message={mapApiError(listado.error)} />}
              {listado.isLoading ? (
                <p className="text-surface-muted" role="status">Cargando reservas...</p>
              ) : listado.isSuccess && reservas.length === 0 ? (
                <div className="text-center py-5">
                  <CalendarDays size={30} className="text-surface-muted mb-2" aria-hidden="true" />
                  <p className="fw-semibold mb-1">No encontramos reservas</p>
                  <p className="small text-surface-muted mb-0">Prueba con otro periodo o estado.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {reservas.map((reserva) => (
                    <article key={reserva.id} className={'reservations-admin__row' + (reservaSeleccionadaId === reserva.id ? ' is-selected' : '')}>
                      <button type="button" className="reservations-admin__select" onClick={() => seleccionarReserva(reserva.id)} aria-pressed={reservaSeleccionadaId === reserva.id}>
                        <span className="reservations-admin__date">
                          <strong>{reserva.hora.slice(0, 5)}</strong>
                          <small>{fechaLegible(reserva.fecha)}</small>
                        </span>
                        <span className="reservations-admin__main">
                          <strong>{reserva.servicio.nombre}</strong>
                          <span><UserRound size={13} aria-hidden="true" /> {reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}</span>
                          <small>{reserva.barbero.nombre} {reserva.barbero.apellido} · {reserva.cliente.esRegistrado ? 'Cuenta registrada' : 'Cliente invitado'}</small>
                        </span>
                        <span className={'reservations-admin__status reservations-admin__status--' + reserva.estado.toLowerCase()}>{estados[reserva.estado]}</span>
                        <ChevronRight size={17} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="col-12 col-xl-5" aria-label="Detalle de reserva">
          <div className="card card-surface border-0 shadow-sm h-100">
            <div className="card-body p-3 p-lg-4">
              {!reservaSeleccionadaId ? (
                <div className="text-center py-5">
                  <Scissors size={28} className="text-surface-muted mb-2" aria-hidden="true" />
                  <h2 className="h5 fw-bold">Detalle de la cita</h2>
                  <p className="small text-surface-muted mb-0">Selecciona una reserva para consultar o actualizar sus datos.</p>
                </div>
              ) : detalle.isLoading ? (
                <p className="text-surface-muted" role="status">Cargando detalle...</p>
              ) : detalle.isError ? (
                <ErrorMessage message={mapApiError(detalle.error)} />
              ) : reservaActiva ? (
                <>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <span className="text-eyebrow">RESERVA #{reservaActiva.id}</span>
                      <h2 className="h4 fw-bold mb-1">{reservaActiva.servicio.nombre}</h2>
                      <p className="text-capitalize text-surface-muted mb-0">{fechaLegible(reservaActiva.fecha)} · {reservaActiva.hora.slice(0, 5)}–{reservaActiva.horaFin.slice(0, 5)}</p>
                    </div>
                    <span className={'reservations-admin__status reservations-admin__status--' + reservaActiva.estado.toLowerCase()}>{estados[reservaActiva.estado]}</span>
                  </div>

                  <div className="reservations-admin__detail-grid">
                    <div><span>CLIENTE</span><strong>{reservaActiva.cliente.nombre} {reservaActiva.cliente.apellido ?? ''}</strong><small>{reservaActiva.cliente.email || reservaActiva.cliente.telefono || 'Sin datos de contacto'}</small></div>
                    <div><span>BARBERO</span><strong>{reservaActiva.barbero.nombre} {reservaActiva.barbero.apellido}</strong></div>
                    <div><span>VALOR</span><strong>{precioCOP(reservaActiva.precio)}</strong></div>
                    <div><span>TIPO DE CUENTA</span><strong>{reservaActiva.cliente.esRegistrado ? 'Registrada' : 'Invitado'}</strong></div>
                  </div>

                  {mensajeAccion && <div className="alert alert-success mt-3" role="status">{mensajeAccion}</div>}
                  {errorAccion && <div className="alert alert-warning mt-3" role="alert">{errorAccion}</div>}

                  {editando && !estadoFinal ? (
                    <EditorFechaReserva
                      key={reservaActiva.id + ':' + reservaActiva.fecha}
                      reserva={reservaActiva}
                      onCancelar={() => setEditando(false)}
                      onGuardar={(fecha, hora) => void guardarCambio(fecha, hora)}
                      guardando={modificarReserva.isPending}
                    />
                  ) : (
                    !estadoFinal && (
                      <div className="d-flex flex-wrap gap-2 mt-4">
                        <Button type="button" variant="outline-primary" onClick={() => setEditando(true)} icon={<Clock3 size={15} />}>
                          Reprogramar
                        </Button>
                        <Button type="button" variant="outline-danger" isLoading={cancelarReserva.isPending} onClick={() => void cancelar()}>
                          Cancelar reserva
                        </Button>
                      </div>
                    )
                  )}
                </>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

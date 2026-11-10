import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Scissors,
  UserRound,
} from 'lucide-react';
import type {
  EstadoReservaDTO,
  FiltroReservasAdministrativasDTO,
  ReservaAdministrativaDTO,
} from '../api/reservas.dto';
import {
  useCancelarReservaAdministrativa,
  useCompletarReserva,
  useDetalleReservaAdministrativa,
  useMarcarReservaNoAsistida,
  useModificarReservaAdministrativa,
  useReservasAdministrativas,
} from '../api/reservas.facade';
import { useBarberosCatalogo } from '../../barberos/api/barberos.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';
import ReservasFiltrosBar from '../components/ReservasFiltrosBar';
import ReservaDetalleDrawer from '../components/ReservaDetalleDrawer';
import {
  ESTADOS_RESERVA_LABELS as estados,
  hoyISO,
  fechaEnNDias,
  fechaLegible,
} from '../lib/reservaFechas';
import './ReservasAdministrativasPage.css';

export default function ReservasAdministrativasPage() {
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const { data: listaBarberos = [] } = useBarberosCatalogo();

  const barberosOrdenados = useMemo(
    () => [...listaBarberos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [listaBarberos]
  );

  const fechaHoy = useMemo(() => hoyISO(), []);
  const fechaSemana = useMemo(() => fechaEnNDias(6), []);
  const fechaMes = useMemo(() => fechaEnNDias(30), []);

  const [desde, setDesde] = useState(fechaHoy);
  const [hasta, setHasta] = useState(fechaSemana);
  const [estado, setEstado] = useState<EstadoReservaDTO | ''>('');
  const [barberoId, setBarberoId] = useState('');
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroReservasAdministrativasDTO>({
    desde: fechaHoy,
    hasta: fechaSemana,
  });
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [diasColapsados, setDiasColapsados] = useState<Set<string>>(new Set());

  const toggleDia = (fecha: string) => {
    setDiasColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(fecha)) {
        next.delete(fecha);
      } else {
        next.add(fecha);
      }
      return next;
    });
  };

  const listado = useReservasAdministrativas(filtroAplicado);
  const detalle = useDetalleReservaAdministrativa(reservaSeleccionadaId);
  const cancelarReserva = useCancelarReservaAdministrativa();
  const modificarReserva = useModificarReservaAdministrativa();
  const completarReserva = useCompletarReserva();
  const marcarNoAsistida = useMarcarReservaNoAsistida();
  const reservas = listado.data ?? [];
  const reservaEnLista = useMemo(
    () => reservas.find((r) => r.id === reservaSeleccionadaId) ?? null,
    [reservas, reservaSeleccionadaId]
  );
  const reservaActiva = detalle.data ?? reservaEnLista;

  const diasAgrupados = useMemo(() => {
    if (!reservas.length) return [];

    const mapa = new Map<string, ReservaAdministrativaDTO[]>();
    for (const r of reservas) {
      const lista = mapa.get(r.fecha);
      if (lista) {
        lista.push(r);
      } else {
        mapa.set(r.fecha, [r]);
      }
    }

    const fechasOrdenadas = Array.from(mapa.keys()).sort((a, b) => a.localeCompare(b));

    return fechasOrdenadas.map((fecha) => {
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const fechaObj = new Date(anio, mes - 1, dia, 12);
      const diaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fechaObj);
      const diaNumero = new Intl.DateTimeFormat('es-CO', { day: '2-digit' }).format(fechaObj);
      const esMismoAnio = fechaObj.getFullYear() === new Date().getFullYear();
      const tituloBruto = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(esMismoAnio ? {} : { year: 'numeric' }),
      }).format(fechaObj);
      const tituloCompleto = tituloBruto.charAt(0).toUpperCase() + tituloBruto.slice(1);

      const citas = [...mapa.get(fecha)!].sort((a, b) => a.hora.localeCompare(b.hora));

      return {
        fecha,
        diaSemana,
        diaNumero,
        tituloCompleto,
        citas,
      };
    });
  }, [reservas]);

  const filtroInvalido =
    !desde ||
    !hasta ||
    desde > hasta ||
    (barberoId !== '' && (
      !Number.isSafeInteger(Number(barberoId)) || Number(barberoId) < 1 || Number(barberoId) > 2_147_483_647
    ));

  const rango = useMemo(() => {
    if (!filtroAplicado.desde && !filtroAplicado.hasta) return 'Todas las fechas';
    if (filtroAplicado.desde && filtroAplicado.hasta) {
      if (filtroAplicado.desde === filtroAplicado.hasta) {
        return fechaLegible(filtroAplicado.desde);
      }
      return fechaLegible(filtroAplicado.desde) + ' – ' + fechaLegible(filtroAplicado.hasta);
    }
    return filtroAplicado.desde ? 'Desde ' + fechaLegible(filtroAplicado.desde) : 'Hasta ' + fechaLegible(filtroAplicado.hasta!);
  }, [filtroAplicado]);

  const barberoSeleccionadoNombre = useMemo(() => {
    if (!filtroAplicado.barberoId) return null;
    const b = listaBarberos.find((barbero) => barbero.id === filtroAplicado.barberoId);
    return b ? `${b.nombre} ${b.apellido}` : `Barbero #${filtroAplicado.barberoId}`;
  }, [filtroAplicado.barberoId, listaBarberos]);

  const presetActivo = useMemo(() => {
    if (desde === fechaHoy && hasta === fechaHoy) return 'hoy';
    if (desde === fechaHoy && hasta === fechaSemana) return 'semana';
    if (desde === fechaHoy && hasta === fechaMes) return 'mes';
    return null;
  }, [desde, hasta, fechaHoy, fechaSemana, fechaMes]);

  const hayFiltrosModificados =
    desde !== fechaHoy ||
    hasta !== fechaSemana ||
    estado !== '' ||
    barberoId !== '' ||
    filtroAplicado.desde !== fechaHoy ||
    filtroAplicado.hasta !== fechaSemana ||
    Boolean(filtroAplicado.estado) ||
    Boolean(filtroAplicado.barberoId);

  const aplicarPresetFecha = (preset: 'hoy' | 'semana' | 'mes') => {
    let nuevaDesde = fechaHoy;
    let nuevaHasta = fechaHoy;

    if (preset === 'semana') {
      nuevaHasta = fechaSemana;
    } else if (preset === 'mes') {
      nuevaHasta = fechaMes;
    }

    setDesde(nuevaDesde);
    setHasta(nuevaHasta);

    const filtros: FiltroReservasAdministrativasDTO = {
      desde: nuevaDesde,
      hasta: nuevaHasta,
    };
    if (estado) filtros.estado = estado;
    if (barberoId) filtros.barberoId = Number(barberoId);

    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado(filtros);
  };

  const restablecerFiltros = () => {
    setDesde(fechaHoy);
    setHasta(fechaSemana);
    setEstado('');
    setBarberoId('');
    setDiasColapsados(new Set());
    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado({
      desde: fechaHoy,
      hasta: fechaSemana,
    });
  };

  const aplicarFiltros = () => {
    if (filtroInvalido) return;
    const filtros: FiltroReservasAdministrativasDTO = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (estado) filtros.estado = estado;
    if (barberoId) filtros.barberoId = Number(barberoId);
    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado(filtros);
  };

  const cancelar = async () => {
    if (!reservaActiva) return;

    const confirmado = await confirm({
      title: 'Cancelar reserva',
      message: (
        <div>
          <p className="mb-2">¿Estás seguro de que deseas cancelar esta reserva?</p>
          <div
            className="p-3 rounded mb-2 border"
            style={{
              backgroundColor: 'var(--surface-app-bg)',
              borderColor: 'var(--surface-card-border)',
            }}
          >
            <div className="fw-bold text-surface-primary mb-1">
              {reservaActiva.servicio.nombre}
            </div>
            <div className="small text-surface-muted mb-1">
              Cliente: <strong>{reservaActiva.cliente.nombre}</strong>
            </div>
            <div className="small text-surface-muted mb-1">
              Barbero: <strong>{reservaActiva.barbero.nombre}</strong>
            </div>
            <div className="small text-surface-muted">
              Fecha y hora: {reservaActiva.fecha} · {reservaActiva.hora}
            </div>
          </div>
          <p className="small text-danger mb-0">
            Esta acción liberará el espacio en la agenda del barbero de inmediato.
          </p>
        </div>
      ),
      confirmLabel: 'Sí, cancelar reserva',
      cancelLabel: 'Volver',
      variant: 'danger',
    });

    if (!confirmado) return;

    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = await cancelarReserva.mutateAsync(reservaActiva.id);
      setMensajeAccion(resultado.mensaje);
      showToast('success', resultado.mensaje);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      const errorMsg = mapApiError(error);
      setErrorAccion(errorMsg);
      showToast('danger', errorMsg);
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

  useEffect(() => {
    if (!reservaSeleccionadaId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReservaSeleccionadaId(null);
        setEditando(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [reservaSeleccionadaId]);

  const seleccionarReserva = (id: number) => {
    setReservaSeleccionadaId((actual) => (actual === id ? null : id));
    setEditando(false);
    setErrorAccion(null);
    setMensajeAccion(null);
  };

  const ejecutarAccionEstado = async (accion: 'completar' | 'no-asistio') => {
    if (!reservaActiva) return;
    const esCompletar = accion === 'completar';

    const confirmado = await confirm({
      title: esCompletar ? 'Completar cita' : 'Marcar inasistencia',
      message: esCompletar ? (
        <div className="d-flex flex-column gap-2 small">
          <p className="mb-0">
            ¿Deseas marcar esta cita como <strong>completada</strong>?
          </p>
          <p className="mb-0 text-surface-muted">
            Esto confirma que el servicio fue prestado y el cliente pagó. Además, se enviará un mensaje de agradecimiento por WhatsApp.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2 small">
          <p className="mb-0">
            ¿Confirmas que el cliente <strong>no asistió</strong> a su cita?
          </p>
          <p className="mb-0 text-surface-muted">
            La cita quedará registrada como inasistencia (NO_SHOW).
          </p>
        </div>
      ),
      confirmLabel: esCompletar ? 'Sí, completar' : 'Sí, marcar no asistió',
      cancelLabel: 'Volver',
      variant: esCompletar ? 'primary' : 'warning',
    });

    if (!confirmado) return;

    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = esCompletar
        ? await completarReserva.mutateAsync(reservaActiva.id)
        : await marcarNoAsistida.mutateAsync(reservaActiva.id);
      setMensajeAccion(resultado.mensaje);
      showToast('success', resultado.mensaje);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      const errorMsg = mapApiError(error);
      setErrorAccion(errorMsg);
      showToast('danger', errorMsg);
    }
  };

  const estadoFinal = reservaActiva
    ? reservaActiva.estado === 'COMPLETED' || reservaActiva.estado === 'CANCELLED' || reservaActiva.estado === 'NO_SHOW'
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

      <ReservasFiltrosBar
        rango={rango}
        barberoSeleccionadoNombre={barberoSeleccionadoNombre}
        presetActivo={presetActivo}
        aplicarPresetFecha={aplicarPresetFecha}
        hayFiltrosModificados={hayFiltrosModificados}
        restablecerFiltros={restablecerFiltros}
        desde={desde}
        setDesde={setDesde}
        hasta={hasta}
        setHasta={setHasta}
        estado={estado}
        setEstado={setEstado}
        estados={estados}
        barberoId={barberoId}
        setBarberoId={setBarberoId}
        barberosOrdenados={barberosOrdenados}
        filtroInvalido={filtroInvalido}
        aplicarFiltros={aplicarFiltros}
      />

      <div className="row g-4">
        <section className="col-12 col-xl-7 col-xxl-8" aria-labelledby="admin-listado-titulo">
          <div className="card card-surface border-0 shadow-sm">
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
              {listado.isLoading && (
                <output className="text-surface-muted d-block py-3">Cargando reservas...</output>
              )}
              {listado.isSuccess && reservas.length === 0 && (
                <div className="text-center py-5">
                  <CalendarDays size={30} className="text-surface-muted mb-2" aria-hidden="true" />
                  <p className="fw-semibold mb-1">No encontramos reservas</p>
                  <p className="small text-surface-muted mb-0">Prueba con otro periodo o estado.</p>
                </div>
              )}
              {listado.isSuccess && reservas.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  {diasAgrupados.map((dia) => (
                    <section key={dia.fecha} className="reservations-admin__day-group" aria-label={dia.tituloCompleto}>
                      <header
                        className="reservations-admin__day-header"
                        onClick={() => toggleDia(dia.fecha)}
                        role="button"
                        aria-expanded={!diasColapsados.has(dia.fecha)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDia(dia.fecha);
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0 overflow-hidden">
                          <div className="reservations-admin__day-date-badge flex-shrink-0" aria-hidden="true">
                            <span>{dia.diaSemana}</span>
                            <strong>{dia.diaNumero}</strong>
                          </div>
                          <div className="flex-grow-1 min-w-0 overflow-hidden">
                            <h3 className="h6 fw-bold mb-0 text-truncate" title={dia.tituloCompleto}>{dia.tituloCompleto}</h3>
                            <small className="text-surface-muted text-truncate d-block">
                              {dia.citas.length} {dia.citas.length === 1 ? 'cita programada' : 'citas programadas'}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                          <span className="reservations-admin__day-count">
                            {dia.citas.length} {dia.citas.length === 1 ? 'cita' : 'citas'}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`reservations-admin__day-chevron ${diasColapsados.has(dia.fecha) ? 'is-collapsed' : ''}`}
                            aria-hidden="true"
                          />
                        </div>
                      </header>

                      {!diasColapsados.has(dia.fecha) && (
                        <div className="d-flex flex-column gap-2">
                          {dia.citas.map((reserva) => (
                            <article key={reserva.id} className={'reservations-admin__row' + (reservaSeleccionadaId === reserva.id ? ' is-selected' : '')}>
                              <button type="button" className="reservations-admin__select" onClick={() => seleccionarReserva(reserva.id)} aria-pressed={reservaSeleccionadaId === reserva.id}>
                                <span className="reservations-admin__date">
                                  <strong>{reserva.hora.slice(0, 5)}</strong>
                                  <small>{reserva.horaFin ? reserva.horaFin.slice(0, 5) : '—'}</small>
                                </span>
                                <span className="reservations-admin__main">
                                  <strong>{reserva.servicio.nombre}</strong>
                                  <span><UserRound size={13} aria-hidden="true" /> {reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}</span>
                                  <small className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                    <span className="reservations-admin__barber-badge">
                                      <Scissors size={12} aria-hidden="true" />
                                      <span>{reserva.barbero.nombre} {reserva.barbero.apellido}</span>
                                    </span>
                                    <span className="text-surface-muted">·</span>
                                    <span className="text-surface-muted small">{reserva.cliente.esRegistrado ? 'Registrado' : 'Invitado'}</span>
                                  </small>
                                </span>
                                <span className={'reservations-admin__status reservations-admin__status--' + reserva.estado.toLowerCase()}>{estados[reserva.estado]}</span>
                                <ChevronRight size={17} aria-hidden="true" />
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <ReservaDetalleDrawer
          reservaActiva={reservaActiva}
          editando={editando}
          setEditando={setEditando}
          estadoFinal={estadoFinal}
          mensajeAccion={mensajeAccion}
          errorAccion={errorAccion}
          completarPending={completarReserva.isPending}
          marcarNoAsistidaPending={marcarNoAsistida.isPending}
          cancelarPending={cancelarReserva.isPending}
          modificarPending={modificarReserva.isPending}
          onEjecutarAccion={ejecutarAccionEstado}
          onGuardarCambio={(fecha, hora) => void guardarCambio(fecha, hora)}
          onCancelarReserva={() => void cancelar()}
          onCerrar={() => {
            setReservaSeleccionadaId(null);
            setEditando(false);
          }}
        />
      </div>
    </main>
  );
}

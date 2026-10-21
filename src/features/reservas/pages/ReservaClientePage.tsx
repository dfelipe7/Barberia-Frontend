import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Check, Clock3, Scissors, UserRound } from 'lucide-react';
import { useServiciosCatalogo } from '../../servicios/api/servicios.facade';
import type { Servicio } from '../../servicios/types/servicios.types';
import { reservasKeys } from '../api/reservas.keys';
import {
  useCrearReserva,
  useDisponibilidadReserva,
  useModificarMiReserva,
  useModificarReservaInvitado,
  useCancelarReservaInvitado,
} from '../api/reservas.facade';
import type {
  ClienteSesionDTO,
  BarberoDisponibleReservaDTO,
  CrearReservaDTO,
  FiltroDisponibilidadReservaDTO,
  ReservaCreadaDTO,
} from '../api/reservas.dto';
import { clientesService, reservasService } from '../api/reservas.service';
import { MisReservasSection } from '../components/MisReservasSection';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import BackLink from '../../../shared/ui/BackLink';
import './ReservaClientePage.css';

interface ReservaLocationState {
  reservaId?: number;
  servicioId?: number;
  barberoId?: number;
  fecha?: string;
  hora?: string;
}

type PasoReserva = 1 | 2 | 3 | 4;

const numeroPositivo = (valor: string | null) => {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 && numero <= 2_147_483_647 ? numero : null;
};

const pasoValido = (valor: string | null): PasoReserva | null => {
  const paso = Number(valor);
  return paso === 1 || paso === 2 || paso === 3 || paso === 4 ? paso : null;
};

const aFechaISO = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
};

const convertirFechaLocal = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(anio, mes - 1, dia, 12);
};

const formatearFecha = (valor: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(convertirFechaLocal(valor));

const formatearDiaCalendario = (valor: string) => {
  const fecha = convertirFechaLocal(valor);
  return {
    semana: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fecha),
    numero: new Intl.DateTimeFormat('es-CO', { day: 'numeric' }).format(fecha),
    mes: new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(fecha),
  };
};

const crearFechasDisponibilidad = (fechaInicio: string, fechaFin: string) => {
  const actual = convertirFechaLocal(fechaInicio);
  const limite = convertirFechaLocal(fechaFin);
  const fechas: string[] = [];

  while (actual <= limite) {
    fechas.push(aFechaISO(actual));
    actual.setDate(actual.getDate() + 1);
  }

  return fechas;
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
    return 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario';
  }

  return mapApiError(error);
};

export const ReservaClientePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialState = (location.state ?? {}) as ReservaLocationState;
  const queryClient = useQueryClient();
  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();
  const crearReserva = useCrearReserva();
  const modificarReserva = useModificarMiReserva();
  const modificarInvitado = useModificarReservaInvitado();
  const cancelarInvitado = useCancelarReservaInvitado();
  const ventana = useMemo(() => crearVentanaDisponibilidad(), []);
  const idReservaUrl = numeroPositivo(searchParams.get('reservaId'));
  const reservaId = idReservaUrl ?? numeroPositivo(initialState.reservaId?.toString() ?? null) ?? undefined;
  const barberoPreseleccionadoId = numeroPositivo(initialState.barberoId?.toString() ?? null);
  const paso = pasoValido(searchParams.get('paso')) ?? (reservaId ? 3 : 1);
  const servicioId = searchParams.has('servicioId')
    ? numeroPositivo(searchParams.get('servicioId'))
    : numeroPositivo(initialState.servicioId?.toString() ?? null);
  const barberoId = searchParams.has('barberoId')
    ? numeroPositivo(searchParams.get('barberoId'))
    : numeroPositivo(initialState.barberoId?.toString() ?? null);
  const fechaSeleccionada = searchParams.has('fecha')
    ? searchParams.get('fecha') || null
    : initialState.fecha ?? null;
  const horaSeleccionada = searchParams.has('hora')
    ? searchParams.get('hora') || null
    : initialState.hora ?? null;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paso]);
  const [paginaFechas, setPaginaFechas] = useState(0);
  const fechasDelRango = useMemo(
    () => crearFechasDisponibilidad(ventana.fechaInicio, ventana.fechaFin),
    [ventana.fechaInicio, ventana.fechaFin],
  );
  const totalPaginasFechas = Math.ceil(fechasDelRango.length / 7);
  const fechasDeLaPagina = fechasDelRango.slice(paginaFechas * 7, paginaFechas * 7 + 7);
  const [reservaCreada, setReservaCreada] = useState<ReservaCreadaDTO | null>(null);
  const [reservaModificada, setReservaModificada] = useState(false);
  const [reservaCancelada, setReservaCancelada] = useState(false);
  const [clienteSesion, setClienteSesion] = useState<ClienteSesionDTO | null>(
    () => clientesService.obtenerSesion(),
  );
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [apellidoInvitado, setApellidoInvitado] = useState('');
  const [telefonoInvitado, setTelefonoInvitado] = useState('');
  const [errorContacto, setErrorContacto] = useState<string | null>(null);

  // El catálogo /servicios incluye IDs de Usuario en sus barberos anidados.
  // Para reservas usamos el endpoint dedicado, que devuelve Barbero.id.
  const consultasBarberosPorServicio = useQueries({
    queries: servicios.map((servicio) => ({
      queryKey: reservasKeys.barberosPorServicio(servicio.id),
      queryFn: () => reservasService.obtenerBarberosPorServicio(servicio.id),
      enabled:
        servicio.estado === 'ACTIVO' &&
        (Boolean(barberoPreseleccionadoId) || (paso >= 2 && servicio.id === servicioId)),
      staleTime: 30_000,
    })),
  });

  const serviciosActivos = servicios.filter((servicio, index) => {
    if (servicio.estado !== 'ACTIVO') return false;
    if (!barberoPreseleccionadoId) return true;
    return consultasBarberosPorServicio[index]?.data?.some(
      (barbero) => barbero.id === barberoPreseleccionadoId,
    );
  });
  const cargandoServiciosDelBarbero = Boolean(barberoPreseleccionadoId) && servicios.some(
    (servicio, index) =>
      servicio.estado === 'ACTIVO' && consultasBarberosPorServicio[index]?.isLoading,
  );
  const erroresServiciosDelBarbero = Boolean(barberoPreseleccionadoId) && servicios.some(
    (servicio, index) =>
      servicio.estado === 'ACTIVO' && consultasBarberosPorServicio[index]?.isError,
  );
  const servicioSeleccionado = serviciosActivos.find((servicio) => servicio.id === servicioId);
  const indiceConsultaBarberos = servicios.findIndex(
    (servicio) => servicio.id === servicioSeleccionado?.id,
  );
  const consultaBarberosServicio = consultasBarberosPorServicio[indiceConsultaBarberos];
  const barberosDelServicio: BarberoDisponibleReservaDTO[] = consultaBarberosServicio?.data ?? [];
  const barberoSeleccionado = barberosDelServicio.find((barbero) => barbero.id === barberoId);

  const filtroDisponibilidad: FiltroDisponibilidadReservaDTO | undefined =
    paso === 3 && servicioSeleccionado && barberoSeleccionado && fechaSeleccionada
      ? {
          servicioId: servicioSeleccionado.id,
          barberoId: barberoSeleccionado.id,
          fecha: fechaSeleccionada,
        }
      : undefined;
  const disponibilidad = useDisponibilidadReserva(filtroDisponibilidad);
  const horariosDisponibles = disponibilidad.data?.slots.filter((slot) => slot.available) ?? [];
  const consultasDisponibilidadFechas = useQueries({
    queries: fechasDeLaPagina.map((fecha) => {
      const filtro = servicioSeleccionado && barberoSeleccionado
        ? {
            servicioId: servicioSeleccionado.id,
            barberoId: barberoSeleccionado.id,
            fecha,
          }
        : undefined;

      return {
        queryKey: reservasKeys.disponibilidad(filtro),
        queryFn: () => reservasService.obtenerDisponibilidad(filtro!),
        enabled: paso === 3 && Boolean(filtro),
        staleTime: 30_000,
      };
    }),
  });
  const erroresDisponibilidadFechas = consultasDisponibilidadFechas.filter(
    (consulta) => consulta.isError,
  );
  const paginaFechasConsultada = consultasDisponibilidadFechas.length > 0 &&
    consultasDisponibilidadFechas.every((consulta) => consulta.isSuccess);
  const paginaSinDisponibilidad = paginaFechasConsultada &&
    consultasDisponibilidadFechas.every(
      (consulta) => !(consulta.data?.slots ?? []).some((slot) => slot.available),
    );

  const actualizarParametros = (
    actualizaciones: Record<string, string | null>,
    replace = true,
  ) => {
    setSearchParams((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      Object.entries(actualizaciones).forEach(([clave, valor]) => {
        if (valor === null) siguientes.delete(clave);
        else siguientes.set(clave, valor);
      });
      return siguientes;
    }, { replace });
  };

  const irAPaso = (
    siguiente: PasoReserva,
    replace = false,
    valoresExtra: Record<string, string | null> = {},
  ) => {
    actualizarParametros({
      paso: String(siguiente),
      servicioId: servicioId ? String(servicioId) : null,
      barberoId: barberoId ? String(barberoId) : null,
      fecha: fechaSeleccionada,
      hora: horaSeleccionada,
      reservaId: reservaId ? String(reservaId) : null,
      ...valoresExtra,
    }, replace);
  };

  const cerrarSesionCliente = () => {
    clientesService.cerrarSesion();
    setClienteSesion(null);
    setReservaCreada(null);
    setReservaModificada(false);
    void queryClient.removeQueries({ queryKey: reservasKeys.all });
  };

  const cambiarServicio = (servicio: Servicio) => {
    setPaginaFechas(0);
    setReservaCreada(null);
    setReservaModificada(false);
    setReservaCancelada(false);
    actualizarParametros({
      servicioId: String(servicio.id),
      barberoId: barberoPreseleccionadoId ? String(barberoPreseleccionadoId) : null,
      fecha: '',
      hora: '',
    });
  };

  const continuarABarberos = () => {
    if (!servicioSeleccionado) return;
    irAPaso(2);
  };

  const continuarADisponibilidad = () => {
    if (!barberoSeleccionado) return;
    setPaginaFechas(0);
    irAPaso(3, false, { fecha: '', hora: '' });
  };

  const confirmarReserva = async () => {
    if (!servicioSeleccionado || !barberoSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      return;
    }

    const tokenInvitado = reservaId ? reservasService.obtenerTokenGestionInvitado(reservaId) : null;
    if (reservaId && !clienteSesion && !tokenInvitado) {
      setErrorContacto('Para cambiar esta cita, inicia sesión con la cuenta que la reservó o abre esta pestaña donde la creaste.');
      return;
    }

    if (!reservaId && !clienteSesion && (!nombreInvitado.trim() || !telefonoInvitado.trim())) {
      setErrorContacto('El nombre y el teléfono son obligatorios para reservar como invitado.');
      return;
    }

    setErrorContacto(null);
    const datos: CrearReservaDTO = {
      servicioId: servicioSeleccionado.id,
      barberoId: barberoSeleccionado.id,
      fecha: fechaSeleccionada,
      hora: horaSeleccionada,
    };

    if (!clienteSesion && !reservaId) {
      datos.nombre = nombreInvitado.trim();
      datos.apellido = apellidoInvitado.trim() || undefined;
      datos.telefono = telefonoInvitado.trim();
    }

    try {
      if (reservaId) {
        const datosModificados = {
          barberoId: barberoSeleccionado.id,
          fecha: fechaSeleccionada,
          hora: horaSeleccionada,
        };
        if (clienteSesion) {
          await modificarReserva.mutateAsync({ id: reservaId, datos: datosModificados });
        } else if (tokenInvitado) {
          await modificarInvitado.mutateAsync({ id: reservaId, token: tokenInvitado, datos: datosModificados });
        }
        setReservaModificada(true);
      } else {
        const resultado = await crearReserva.mutateAsync(datos);
        setReservaCreada(resultado);
        actualizarParametros({ reservaId: String(resultado.id) });
      }
    } catch {
      // El error de API se muestra en el resumen.
    }
  };

  const volverASeleccionHorario = () => {
    if (servicioSeleccionado && barberoSeleccionado && fechaSeleccionada) {
      void queryClient.invalidateQueries({
        queryKey: reservasKeys.disponibilidad({
          servicioId: servicioSeleccionado.id,
          barberoId: barberoSeleccionado.id,
          fecha: fechaSeleccionada,
        }),
        exact: true,
      });
    }

    irAPaso(3, false, { hora: '' });
  };

  const enviarReserva = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void confirmarReserva();
  };

  const volverPaso = () => {
    irAPaso(Math.max(1, paso - 1) as PasoReserva);
    setErrorContacto(null);
  };

  const errorConfirmacion = reservaId
    ? (clienteSesion ? modificarReserva.error : modificarInvitado.error)
    : crearReserva.error;
  const conflictoReserva = isAxiosError(errorConfirmacion) && errorConfirmacion.response?.status === 409;
  const rutaActual = location.pathname + location.search;

  const cancelarReservaDeInvitado = async () => {
    if (!reservaCreada || clienteSesion) return;
    const token = reservasService.obtenerTokenGestionInvitado(reservaCreada.id);
    if (!token) {
      setErrorContacto('No encontramos los datos de gestión de esta cita en esta pestaña.');
      return;
    }
    if (!window.confirm('¿Quieres cancelar esta cita?')) return;
    try {
      await cancelarInvitado.mutateAsync({ id: reservaCreada.id, token });
      reservasService.eliminarTokenGestionInvitado(reservaCreada.id);
      setReservaCancelada(true);
      setReservaCreada(null);
      actualizarParametros({
        paso: '1',
        reservaId: null,
        servicioId: null,
        barberoId: null,
        fecha: null,
        hora: null,
      });
    } catch (error: unknown) {
      setErrorContacto(mapApiError(error));
    }
  };

  const cambiarReservaDeInvitado = () => {
    if (!reservaCreada || clienteSesion || !servicioSeleccionado || !barberoSeleccionado) return;
    const query = new URLSearchParams({
      paso: '3',
      reservaId: String(reservaCreada.id),
      servicioId: String(servicioSeleccionado.id),
      barberoId: String(barberoSeleccionado.id),
      fecha: reservaCreada.fecha,
      hora: reservaCreada.hora,
    });
    navigate({ pathname: '/reservar', search: query.toString() }, {
      state: {
        reservaId: reservaCreada.id,
        servicioId: servicioSeleccionado.id,
        barberoId: barberoSeleccionado.id,
        fecha: reservaCreada.fecha,
        hora: reservaCreada.hora,
      },
    });
  };

  return (
    <main className="booking-flow container py-4 py-lg-5" style={{ maxWidth: '1080px' }}>
      <header className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <BackLink to="/">Volver al sitio público</BackLink>
          {paso > 1 && (
            <Button type="button" variant="outline-secondary" onClick={volverPaso} icon={<ArrowLeft size={16} />}>
              Paso anterior
            </Button>
          )}
        </div>
        <span className="text-eyebrow d-block mb-2">RESERVAS / {reservaId && !reservaCreada ? 'CAMBIAR CITA' : 'NUEVA CITA'}</span>
        <h1 className="h2 fw-bold mb-1">{reservaId && !reservaCreada ? 'Modifica tu reserva' : 'Reserva tu cita'}</h1>
        <p className="text-surface-muted mb-0">Elige un servicio, un barbero y una fecha con horario disponible.</p>
      </header>

      <section className="card card-surface border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            {clienteSesion ? (
              <>
                <h2 className="h6 fw-bold mb-1">
                  Sesión de cliente: {clienteSesion.nombre} {clienteSesion.apellido ?? ''}
                </h2>
                <p className="small text-surface-muted mb-0">
                  Tus reservas quedarán asociadas a esta cuenta.
                </p>
              </>
            ) : (
              <>
                <h2 className="h6 fw-bold mb-1">Reserva como invitado o con tu cuenta</h2>
                <p className="small text-surface-muted mb-0">
                  Con tu cuenta podrás consultar y cambiar tus citas desde aquí.
                </p>
              </>
            )}
          </div>
          {clienteSesion ? (
            <div className="d-flex flex-wrap align-items-center gap-3">
              <a className="btn btn-sm btn-outline-primary" href="#mis-reservas">
                Ver mis reservas
              </a>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cerrarSesionCliente}>
                Cerrar sesión de cliente
              </button>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              <Link
                className="btn btn-outline-secondary"
                to={'/cliente/iniciar-sesion?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Iniciar sesión
              </Link>
              <Link
                className="btn btn-primary"
                to={'/cliente/registro?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </section>

      {clienteSesion && <MisReservasSection />}

      <nav aria-label="Pasos de la reserva" className="mb-4 booking-stepper">
        <ol className="list-unstyled d-flex flex-wrap gap-2 mb-0">
          {[
            { numero: 1, label: 'Servicio', icono: <Scissors size={15} /> },
            { numero: 2, label: 'Barbero', icono: <UserRound size={15} /> },
            { numero: 3, label: 'Fecha y hora', icono: <CalendarDays size={15} /> },
            { numero: 4, label: 'Confirmar', icono: <Check size={15} /> },
          ].map((item) => (
            <li key={item.numero}>
              <button
                type="button"
                className={'booking-stepper__step ' + (
                  paso === item.numero
                    ? 'is-current'
                    : paso > item.numero
                      ? 'is-done'
                      : ''
                )}
                aria-current={paso === item.numero ? 'step' : undefined}
                disabled={item.numero > paso}
                onClick={() => irAPaso(item.numero as PasoReserva)}
              >
                {paso > item.numero ? <Check size={15} /> : item.icono}
                <span>{item.label}</span>
              </button>
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

          {(isLoading || cargandoServiciosDelBarbero) && (
            <div className="d-flex justify-content-center py-5" role="status">
              <KyriosSpinner
                size="md"
                mensaje={cargandoServiciosDelBarbero ? 'Buscando servicios del barbero...' : 'Cargando servicios...'}
              />
            </div>
          )}

          {erroresServiciosDelBarbero && (
            <div className="alert alert-warning">
              <ErrorMessage message="No fue posible consultar qué servicios ofrece este barbero." />
              <button
                type="button"
                className="btn btn-sm btn-outline-warning mt-2"
                onClick={() => {
                  void Promise.all(
                    consultasBarberosPorServicio.map((consulta) => consulta.refetch()),
                  );
                }}
                disabled={consultasBarberosPorServicio.some((consulta) => consulta.isFetching)}
              >
                Reintentar
              </button>
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

          {!isLoading && !cargandoServiciosDelBarbero && !error && !erroresServiciosDelBarbero && serviciosActivos.length === 0 && (
            <p className="alert alert-light border mb-0">
              No hay servicios disponibles para reservar.
            </p>
          )}

          {!isLoading && !cargandoServiciosDelBarbero && !error && serviciosActivos.length > 0 && (
            <div className="row g-2">
              {serviciosActivos.map((servicio) => {
                const foto = obtenerUrlFoto(servicio.fotoUrl);
                const seleccionado = servicio.id === servicioId;
                return (
                  <div className="col-12 col-sm-6 col-lg-4" key={servicio.id}>
                    <button
                      type="button"
                      className={'card card-surface border w-100 h-100 text-start p-0 overflow-hidden ' + (
                        seleccionado ? 'border-primary shadow-sm' : ''
                      )}
                      aria-pressed={seleccionado}
                      onClick={() => cambiarServicio(servicio)}
                    >
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          className="w-100 object-fit-cover"
                          style={{ height: '124px' }}
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
                          {seleccionado && <span className="badge text-bg-primary">Seleccionado</span>}
                        </span>
                        <span className="booking-flow__service-description small text-surface-muted flex-grow-1">
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

        </section>
      )}

      {paso === 2 && servicioSeleccionado && (
        <section aria-labelledby="seleccionar-barbero-titulo">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 id="seleccionar-barbero-titulo" className="h5 fw-bold mb-1">2. Elige un barbero</h2>
              <p className="small text-surface-muted mb-0">
                Barberos habilitados para {servicioSeleccionado.nombre}.
              </p>
            </div>
            {!reservaId && (
              <Button type="button" size="sm" variant="outline-secondary" onClick={() => irAPaso(1)}>
                Cambiar servicio
              </Button>
            )}
          </div>

          {consultaBarberosServicio?.isLoading && (
            <div className="d-flex justify-content-center py-4" role="status">
              <KyriosSpinner size="md" mensaje="Cargando barberos habilitados para el servicio..." />
            </div>
          )}

          {consultaBarberosServicio?.error && (
            <div className="alert alert-warning">
              <ErrorMessage message={mapApiError(consultaBarberosServicio.error)} />
              <button
                type="button"
                className="btn btn-sm btn-outline-warning mt-2"
                onClick={() => void consultaBarberosServicio.refetch()}
                disabled={consultaBarberosServicio.isFetching}
              >
                Reintentar
              </button>
            </div>
          )}

          {consultaBarberosServicio?.isSuccess && barberosDelServicio.length === 0 && (
            <p className="alert alert-light border mb-0">No hay barberos para este servicio.</p>
          )}

          {barberosDelServicio.length > 0 && (
            <div className="row g-3">
              {barberosDelServicio.map((barbero) => {
                const seleccionado = barbero.id === barberoId;
                const foto = obtenerUrlFoto(barbero.fotoUrl);
                return (
                  <div className="col-12 col-sm-6 col-lg-4" key={barbero.id}>
                    <button
                      type="button"
                      className={'card card-surface border w-100 h-100 text-center p-3 ' + (
                        seleccionado ? 'border-primary shadow-sm' : ''
                      )}
                      aria-pressed={seleccionado}
                      onClick={() => {
                        setPaginaFechas(0);
                        actualizarParametros({
                          barberoId: String(barbero.id),
                          fecha: '',
                          hora: '',
                        });
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
                      <span className="fw-semibold">{barbero.nombre} {barbero.apellido}</span>
                      {seleccionado && <span className="badge text-bg-primary mx-auto mt-2">Seleccionado</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </section>
      )}

      {paso === 3 && servicioSeleccionado && barberoSeleccionado && (
        <section aria-labelledby="seleccionar-fecha-titulo">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 id="seleccionar-fecha-titulo" className="h5 fw-bold mb-1">3. Elige fecha y hora</h2>
              <p className="small text-surface-muted mb-0">
                Consulta la disponibilidad de {barberoSeleccionado.nombre} para cada fecha.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline-secondary" onClick={() => irAPaso(2)}>
              Cambiar barbero
            </Button>
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <p className="small text-surface-muted mb-0">
              Elige un día con horarios disponibles dentro de los próximos 30 días.
            </p>
            <div className="d-flex align-items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                disabled={paginaFechas === 0}
                onClick={() => setPaginaFechas((pagina) => Math.max(0, pagina - 1))}
              >
                Semana anterior
              </Button>
              <span className="small text-surface-muted" aria-live="polite">
                {paginaFechas + 1} de {totalPaginasFechas}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                disabled={paginaFechas >= totalPaginasFechas - 1}
                onClick={() => setPaginaFechas((pagina) => Math.min(totalPaginasFechas - 1, pagina + 1))}
              >
                Semana siguiente
              </Button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Fechas con disponibilidad">
            {fechasDeLaPagina.map((fecha, indice) => {
              const consulta = consultasDisponibilidadFechas[indice];
              const cantidadHorarios = consulta?.data?.slots.filter((slot) => slot.available).length ?? 0;
              const etiquetasFecha = formatearDiaCalendario(fecha);
              const seleccionada = fechaSeleccionada === fecha;
              const deshabilitada = !consulta || consulta.isLoading || consulta.isError || cantidadHorarios === 0;

              return (
                <button
                  key={fecha}
                  type="button"
                  className={'btn border rounded-3 d-flex flex-column align-items-center justify-content-center px-3 py-2 ' + (
                    seleccionada ? 'btn-primary border-primary' : 'btn-outline-primary'
                  )}
                  style={{ minWidth: '94px', minHeight: '96px', flex: '1 1 94px' }}
                  aria-pressed={seleccionada}
                  aria-label={`${etiquetasFecha.semana} ${etiquetasFecha.numero} de ${etiquetasFecha.mes}: ${cantidadHorarios} horarios disponibles`}
                  disabled={deshabilitada}
                  onClick={() => {
                    actualizarParametros({ fecha, hora: '' });
                  }}
                >
                  <span className="small text-capitalize">{etiquetasFecha.semana}</span>
                  <span className="fs-5 fw-bold">{etiquetasFecha.numero}</span>
                  <span className="small text-capitalize">{etiquetasFecha.mes}</span>
                  <span className="small mt-1">
                    {consulta?.isLoading ? 'Consultando…' : consulta?.isError ? 'No disponible' : `${cantidadHorarios} ${cantidadHorarios === 1 ? 'hora' : 'horas'}`}
                  </span>
                </button>
              );
            })}
          </div>

          {erroresDisponibilidadFechas.length > 0 && (
            <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
              <ErrorMessage message={mapApiError(erroresDisponibilidadFechas[0].error)} />
              <Button
                type="button"
                size="sm"
                variant="outline-warning"
                onClick={() => erroresDisponibilidadFechas.forEach((consulta) => void consulta.refetch())}
              >
                Reintentar consulta
              </Button>
            </div>
          )}

          {paginaSinDisponibilidad && !fechaSeleccionada && (
            <p className="alert alert-light border mb-3">
              No hay fechas con horarios disponibles en esta semana.
            </p>
          )}

          {!fechaSeleccionada && erroresDisponibilidadFechas.length === 0 && !paginaSinDisponibilidad && (
            <p className="small text-surface-muted mb-3" role="status">
              Consultando disponibilidad para las fechas de esta semana…
            </p>
          )}

          {fechaSeleccionada && disponibilidad.isLoading && (
            <div className="d-flex justify-content-center py-4" role="status">
              <KyriosSpinner size="md" mensaje="Consultando disponibilidad..." />
            </div>
          )}

          {fechaSeleccionada && disponibilidad.error && (
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

          {fechaSeleccionada && !disponibilidad.isLoading && !disponibilidad.error && horariosDisponibles.length === 0 && (
            <p className="alert alert-light border mb-0">
              No hay horas disponibles para {formatearFecha(fechaSeleccionada)}.
            </p>
          )}

          {fechaSeleccionada && !disponibilidad.isLoading && !disponibilidad.error && horariosDisponibles.length > 0 && (
            <>
              <h3 className="h6 fw-bold mb-2">Horas disponibles para {formatearFecha(fechaSeleccionada)}</h3>
              <div className="d-flex flex-wrap gap-2">
                {horariosDisponibles.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    className={'btn rounded-pill ' + (
                      slot.startTime === horaSeleccionada ? 'btn-primary' : 'btn-outline-primary'
                    )}
                    aria-pressed={slot.startTime === horaSeleccionada}
                    onClick={() => actualizarParametros({ hora: slot.startTime })}
                  >
                    {slot.startTime}–{slot.endTime}
                  </button>
                ))}
              </div>
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="button"
                  disabled={!fechaSeleccionada || !horaSeleccionada}
                  onClick={() => irAPaso(4)}
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
              <h2 id="resumen-reserva-titulo" className="h5 fw-bold mb-1">Resumen de reserva</h2>
              <p className="small text-surface-muted mb-0">Revisa los datos antes de confirmar.</p>
            </div>
            {!reservaCreada && !reservaModificada && (
              <Button type="button" size="sm" variant="outline-secondary" onClick={() => irAPaso(3)}>
                Modificar
              </Button>
            )}
          </div>

          {errorConfirmacion && (
            <div className="alert alert-warning" role="alert">
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
            <div className="alert alert-success" role="status">
              <h3 className="h6 fw-bold mb-1">
                {reservaModificada ? 'Reserva modificada correctamente' : reservaCreada?.mensaje}
              </h3>
              <p className="mb-1">
                {servicioSeleccionado.nombre} con {barberoSeleccionado.nombre} {barberoSeleccionado.apellido},
                {' '}{formatearFecha(fechaSeleccionada ?? '')} de {horaSeleccionada}.
              </p>
              <p className="small mb-0">
                Reserva #{reservaCreada?.id ?? reservaId}
                {reservaCreada ? ' · Estado: ' + reservaCreada.estado : ''}
              </p>
              {reservaCreada && !clienteSesion && reservaCreada.tokenGestion && (
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button type="button" size="sm" variant="outline-primary" onClick={cambiarReservaDeInvitado}>
                    Cambiar fecha u hora
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline-danger"
                    isLoading={cancelarInvitado.isPending}
                    onClick={() => void cancelarReservaDeInvitado()}
                  >
                    Cancelar cita
                  </Button>
                </div>
              )}
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
                <dd className="col-sm-8 fw-semibold">{servicioSeleccionado.duracionMinutos} minutos</dd>
                <dt className="col-sm-4 text-surface-muted">Precio</dt>
                <dd className="col-sm-8 fw-semibold mb-0">{formatearPrecio(servicioSeleccionado.precio)}</dd>
              </dl>

              <form onSubmit={enviarReserva}>
              {clienteSesion ? (
                <p className="small text-surface-muted">
                  La reserva quedará asociada a {clienteSesion.email || clienteSesion.nombre}.
                </p>
              ) : !reservaId ? (
                <div className="border rounded-3 p-3 mb-4">
                  <h3 className="h6 fw-bold mb-3">Datos de contacto</h3>
                  <p className="small text-surface-muted">
                    Déjanos tus datos para confirmar la cita y enviarte sus detalles.
                  </p>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-nombre" className="form-label small fw-semibold">Nombre <span className="text-surface-muted fw-normal">(máx. 100)</span></label>
                      <input
                        id="invitado-nombre"
                        className="form-control"
                        autoComplete="given-name"
                        value={nombreInvitado}
                        maxLength={100}
                        onChange={(event) => setNombreInvitado(event.target.value)}
                        required
                      />
                      <div className="form-text text-end">{nombreInvitado.length}/100</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-apellido" className="form-label small fw-semibold">Apellido <span className="text-surface-muted fw-normal">(máx. 100)</span></label>
                      <input
                        id="invitado-apellido"
                        className="form-control"
                        autoComplete="family-name"
                        value={apellidoInvitado}
                        maxLength={100}
                        onChange={(event) => setApellidoInvitado(event.target.value)}
                      />
                      <div className="form-text text-end">{apellidoInvitado.length}/100</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-telefono" className="form-label small fw-semibold">Teléfono <span className="text-surface-muted fw-normal">(máx. 30)</span></label>
                      <input
                        id="invitado-telefono"
                        type="tel"
                        className="form-control"
                        autoComplete="tel"
                        value={telefonoInvitado}
                        maxLength={30}
                        onChange={(event) => setTelefonoInvitado(event.target.value)}
                        required
                      />
                      <div className="form-text text-end">{telefonoInvitado.length}/30</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="small text-surface-muted">La cita se actualizará con los datos de gestión asociados a esta reserva.</p>
              )}

              {errorContacto && <ErrorMessage message={errorContacto} />}
              <div className="d-flex justify-content-end">
                <Button
                  type="submit"
                  isLoading={crearReserva.isPending || modificarReserva.isPending || modificarInvitado.isPending}
                  loadingText={reservaId ? 'Guardando cambios...' : 'Confirmando reserva...'}
                  disabled={!fechaSeleccionada || !horaSeleccionada || (reservaId !== undefined && !clienteSesion && !reservasService.obtenerTokenGestionInvitado(reservaId))}
                >
                  {reservaId ? 'Guardar cambios' : 'Confirmar reserva'}
                </Button>
              </div>
              </form>
            </>
          )}
        </section>
      )}

      {reservaCancelada && (
        <div className="alert alert-success" role="status">
          <strong>Tu cita fue cancelada.</strong> Si deseas, puedes reservar otro horario.
        </div>
      )}

      {paso === 1 && (
        <div className="booking-flow__floating-actions">
          <div className="booking-flow__floating-summary">
            <span className="booking-flow__floating-label">Servicio</span>
            <strong>{servicioSeleccionado?.nombre ?? 'Selecciona una opción'}</strong>
          </div>
          <Button type="button" disabled={!servicioSeleccionado} onClick={continuarABarberos}>
            Continuar
          </Button>
        </div>
      )}

      {paso === 2 && (
        <div className="booking-flow__floating-actions">
          <div className="booking-flow__floating-summary">
            <span className="booking-flow__floating-label">Tu cita</span>
            <strong>
              {servicioSeleccionado?.nombre ?? 'Servicio'} · {barberoSeleccionado
                ? barberoSeleccionado.nombre + ' ' + barberoSeleccionado.apellido
                : 'Elige un barbero'}
            </strong>
          </div>
          <Button type="button" disabled={!barberoSeleccionado} onClick={continuarADisponibilidad}>
            Elegir fecha
          </Button>
        </div>
      )}

      {paso > 1 && (
        <div className="mt-4 pt-3 border-top small text-surface-muted">
          <span className="fw-semibold">Tu selección:</span>{' '}
          {servicioSeleccionado?.nombre ?? 'elige un servicio'}
          {barberoSeleccionado ? ' · ' + barberoSeleccionado.nombre + ' ' + barberoSeleccionado.apellido : ''}
          {fechaSeleccionada ? ' · ' + formatearFecha(fechaSeleccionada) : ''}
          {horaSeleccionada ? ' · ' + horaSeleccionada : ''}
        </div>
      )}
    </main>
  );
};

export default ReservaClientePage;

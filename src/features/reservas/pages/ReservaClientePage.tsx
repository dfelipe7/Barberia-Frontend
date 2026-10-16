import { useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useLocation } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Check, Clock3, Scissors, UserRound } from 'lucide-react';
import { useServiciosCatalogo } from '../../servicios/api/servicios.facade';
import type { Servicio } from '../../servicios/types/servicios.types';
import { reservasKeys } from '../api/reservas.keys';
import {
  useCrearReserva,
  useDisponibilidadReserva,
  useModificarMiReserva,
} from '../api/reservas.facade';
import type {
  ClienteSesionDTO,
  BarberoDisponibleReservaDTO,
  CrearReservaDTO,
  DescuentoAplicadoDTO,
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

interface ReservaLocationState {
  reservaId?: number;
  servicioId?: number;
  barberoId?: number;
}

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
  const initialState = (location.state ?? {}) as ReservaLocationState;
  const queryClient = useQueryClient();
  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();
  const crearReserva = useCrearReserva();
  const modificarReserva = useModificarMiReserva();
  const ventana = useMemo(() => crearVentanaDisponibilidad(), []);
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(initialState.reservaId ? 3 : 1);
  const [servicioId, setServicioId] = useState<number | null>(initialState.servicioId ?? null);
  const [barberoId, setBarberoId] = useState<number | null>(initialState.barberoId ?? null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [paginaFechas, setPaginaFechas] = useState(0);
  const fechasDelRango = useMemo(
    () => crearFechasDisponibilidad(ventana.fechaInicio, ventana.fechaFin),
    [ventana.fechaInicio, ventana.fechaFin],
  );
  const totalPaginasFechas = Math.ceil(fechasDelRango.length / 7);
  const fechasDeLaPagina = fechasDelRango.slice(paginaFechas * 7, paginaFechas * 7 + 7);
  const [reservaCreada, setReservaCreada] = useState<ReservaCreadaDTO | null>(null);
  const [reservaModificada, setReservaModificada] = useState(false);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState<DescuentoAplicadoDTO | null>(null);
  const [validandoDescuento, setValidandoDescuento] = useState(false);
  const [errorDescuento, setErrorDescuento] = useState<string | null>(null);
  const [clienteSesion, setClienteSesion] = useState<ClienteSesionDTO | null>(
    () => clientesService.obtenerSesion(),
  );
  const [errorLoginCliente, setErrorLoginCliente] = useState<string | null>(null);
  const [loginClienteCargando, setLoginClienteCargando] = useState(false);
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
        (Boolean(initialState.barberoId) || (paso >= 2 && servicio.id === servicioId)),
      staleTime: 30_000,
    })),
  });

  const serviciosActivos = servicios.filter((servicio, index) => {
    if (servicio.estado !== 'ACTIVO') return false;
    if (!initialState.barberoId) return true;
    return consultasBarberosPorServicio[index]?.data?.some(
      (barbero) => barbero.id === initialState.barberoId,
    );
  });
  const cargandoServiciosDelBarbero = Boolean(initialState.barberoId) && servicios.some(
    (servicio, index) =>
      servicio.estado === 'ACTIVO' && consultasBarberosPorServicio[index]?.isLoading,
  );
  const erroresServiciosDelBarbero = Boolean(initialState.barberoId) && servicios.some(
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

  const iniciarSesionCliente = async (respuesta: CredentialResponse) => {
    if (!respuesta.credential) {
      setErrorLoginCliente('Google no devolvió la credencial de acceso.');
      return;
    }

    setLoginClienteCargando(true);
    setErrorLoginCliente(null);
    try {
      const sesion = await clientesService.iniciarSesionGoogle(respuesta.credential);
      clientesService.guardarSesion(sesion);
      setClienteSesion(sesion.cliente);
      await queryClient.invalidateQueries({ queryKey: reservasKeys.misReservas() });
    } catch (error: unknown) {
      setErrorLoginCliente(mapApiError(error));
    } finally {
      setLoginClienteCargando(false);
    }
  };

  const cerrarSesionCliente = () => {
    clientesService.cerrarSesion();
    setClienteSesion(null);
    setReservaCreada(null);
    void queryClient.removeQueries({ queryKey: reservasKeys.all });
  };

  const cambiarServicio = (servicio: Servicio) => {
    setServicioId(servicio.id);
    setBarberoId(initialState.barberoId ?? null);
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
    setPaginaFechas(0);
    setReservaCreada(null);
    setReservaModificada(false);
    setDescuentoAplicado(null);
    setCodigoDescuento('');
    setErrorDescuento(null);
  };

  const continuarABarberos = () => {
    if (!servicioSeleccionado) return;
    setPaso(2);
  };

  const continuarADisponibilidad = () => {
    if (!barberoSeleccionado) return;
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
    setPaginaFechas(0);
    setPaso(3);
  };

  const aplicarDescuento = async () => {
    if (!servicioSeleccionado || !codigoDescuento.trim()) return;
    setValidandoDescuento(true);
    setErrorDescuento(null);
    try {
      const resultado = await reservasService.validarDescuento({
        codigo: codigoDescuento.trim(),
        servicioId: servicioSeleccionado.id,
      });
      setDescuentoAplicado(resultado);
    } catch (error: unknown) {
      setDescuentoAplicado(null);
      setErrorDescuento(mapApiError(error));
    } finally {
      setValidandoDescuento(false);
    }
  };

  const retirarDescuento = () => {
    setDescuentoAplicado(null);
    setCodigoDescuento('');
    setErrorDescuento(null);
  };

  const confirmarReserva = async () => {
    if (!servicioSeleccionado || !barberoSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      return;
    }

    if (initialState.reservaId && !clienteSesion) {
      setErrorContacto('Inicia sesión con la cuenta de cliente que creó esta reserva para modificarla.');
      return;
    }

    if (!initialState.reservaId && !clienteSesion && (!nombreInvitado.trim() || !telefonoInvitado.trim())) {
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

    if (!initialState.reservaId && descuentoAplicado) {
      datos.codigoDescuento = descuentoAplicado.codigo;
    }

    if (!clienteSesion && !initialState.reservaId) {
      datos.nombre = nombreInvitado.trim();
      datos.apellido = apellidoInvitado.trim() || undefined;
      datos.telefono = telefonoInvitado.trim();
    }

    try {
      if (initialState.reservaId) {
        await modificarReserva.mutateAsync({
          id: initialState.reservaId,
          datos: {
            barberoId: barberoSeleccionado.id,
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
          },
        });
        setReservaModificada(true);
      } else {
        const resultado = await crearReserva.mutateAsync(datos);
        setReservaCreada(resultado);
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

    setHoraSeleccionada(null);
    setPaso(3);
  };

  const enviarReserva = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void confirmarReserva();
  };

  const volverPaso = () => {
    setPaso((actual) => Math.max(1, actual - 1) as 1 | 2 | 3 | 4);
    setErrorContacto(null);
  };

  const errorConfirmacion = initialState.reservaId ? modificarReserva.error : crearReserva.error;
  const conflictoReserva = isAxiosError(errorConfirmacion) && errorConfirmacion.response?.status === 409;

  return (
    <main className="container py-4 py-lg-5" style={{ maxWidth: '1080px' }}>
      <header className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <BackLink to="/">Volver al sitio público</BackLink>
          {paso > 1 && (
            <Button type="button" variant="outline-secondary" onClick={volverPaso} icon={<ArrowLeft size={16} />}>
              Paso anterior
            </Button>
          )}
        </div>
        <span className="text-eyebrow d-block mb-2">RESERVAS / {initialState.reservaId ? 'CAMBIAR CITA' : 'NUEVA CITA'}</span>
        <h1 className="h2 fw-bold mb-1">{initialState.reservaId ? 'Modifica tu reserva' : 'Reserva tu cita'}</h1>
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
                <h2 className="h6 fw-bold mb-1">Reserva como invitado o inicia sesión</h2>
                <p className="small text-surface-muted mb-0">
                  Con Google puedes consultar después tus reservas desde esta pantalla.
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
          ) : loginClienteCargando ? (
            <KyriosSpinner size="sm" mensaje="Iniciando sesión..." />
          ) : (
            <div className="d-flex flex-column align-items-start gap-2">
              <GoogleLogin
                onSuccess={(respuesta) => void iniciarSesionCliente(respuesta)}
                onError={() => setErrorLoginCliente('No se pudo iniciar sesión con Google.')}
                useOneTap={false}
                theme="outline"
                shape="pill"
                size="medium"
                text="continue_with"
              />
              {errorLoginCliente && <ErrorMessage message={errorLoginCliente} />}
            </div>
          )}
        </div>
      </section>

      {clienteSesion && <MisReservasSection />}

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
              className={'badge rounded-pill border d-inline-flex align-items-center gap-2 px-3 py-2 ' + (
                paso === item.numero
                  ? 'text-bg-dark border-dark'
                  : paso > item.numero
                    ? 'text-bg-success border-success'
                    : 'text-bg-light text-surface-muted'
              )}
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
            <div className="row g-3">
              {serviciosActivos.map((servicio) => {
                const foto = obtenerUrlFoto(servicio.fotoUrl);
                const seleccionado = servicio.id === servicioId;
                return (
                  <div className="col-12 col-md-6" key={servicio.id}>
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
                          {seleccionado && <span className="badge text-bg-primary">Seleccionado</span>}
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
            <Button type="button" disabled={!servicioSeleccionado} onClick={continuarABarberos}>
              Continuar con este servicio
            </Button>
          </div>
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
            {!initialState.reservaId && (
              <Button type="button" size="sm" variant="outline-secondary" onClick={() => setPaso(1)}>
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
                        setBarberoId(barbero.id);
                        setFechaSeleccionada(null);
                        setHoraSeleccionada(null);
                        setPaginaFechas(0);
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

          <div className="d-flex justify-content-end mt-4">
            <Button type="button" disabled={!barberoSeleccionado} onClick={continuarADisponibilidad}>
              Continuar a fecha y hora
            </Button>
          </div>
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
            <Button type="button" size="sm" variant="outline-secondary" onClick={() => setPaso(2)}>
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
                    setFechaSeleccionada(fecha);
                    setHoraSeleccionada(null);
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
                    onClick={() => setHoraSeleccionada(slot.startTime)}
                  >
                    {slot.startTime}–{slot.endTime}
                  </button>
                ))}
              </div>
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
              <h2 id="resumen-reserva-titulo" className="h5 fw-bold mb-1">Resumen de reserva</h2>
              <p className="small text-surface-muted mb-0">Revisa los datos antes de confirmar.</p>
            </div>
            {!reservaCreada && !reservaModificada && (
              <Button type="button" size="sm" variant="outline-secondary" onClick={() => setPaso(3)}>
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
                Reserva #{reservaCreada?.id ?? initialState.reservaId}
                {reservaCreada ? ' · Estado: ' + reservaCreada.estado : ''}
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
                <dd className="col-sm-8 fw-semibold">{servicioSeleccionado.duracionMinutos} minutos</dd>
                <dt className="col-sm-4 text-surface-muted">Precio</dt>
                <dd className="col-sm-8 fw-semibold mb-0">
                  {formatearPrecio(descuentoAplicado?.precioFinal ?? servicioSeleccionado.precio)}
                  {descuentoAplicado && (
                    <span className="small text-success d-block">
                      Antes {formatearPrecio(descuentoAplicado.precioOriginal)} · ahorras {formatearPrecio(descuentoAplicado.montoDescuento)}
                    </span>
                  )}
                </dd>
              </dl>

              {!initialState.reservaId && (
                <section className="border rounded-3 p-3 mb-4" aria-labelledby="descuento-reserva-titulo">
                  <h3 id="descuento-reserva-titulo" className="h6 fw-bold mb-2">¿Tienes un código de descuento?</h3>
                  {descuentoAplicado ? (
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <p className="small text-success mb-0">Código {descuentoAplicado.codigo} aplicado.</p>
                      <Button type="button" size="sm" variant="outline-secondary" onClick={retirarDescuento}>
                        Quitar descuento
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      <label className="visually-hidden" htmlFor="codigo-descuento">Código de descuento</label>
                      <input
                        id="codigo-descuento"
                        className="form-control"
                        style={{ maxWidth: '320px' }}
                        value={codigoDescuento}
                        onChange={(event) => setCodigoDescuento(event.target.value)}
                        placeholder="Ingresa tu código"
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        variant="outline-primary"
                        isLoading={validandoDescuento}
                        loadingText="Validando..."
                        disabled={!codigoDescuento.trim()}
                        onClick={() => void aplicarDescuento()}
                      >
                        Aplicar descuento
                      </Button>
                    </div>
                  )}
                  {errorDescuento && <div className="mt-2"><ErrorMessage message={errorDescuento} /></div>}
                </section>
              )}

              <form onSubmit={enviarReserva}>
              {clienteSesion ? (
                <p className="small text-surface-muted">
                  La reserva quedará asociada a {clienteSesion.email || clienteSesion.nombre}.
                </p>
              ) : (
                <div className="border rounded-3 p-3 mb-4">
                  <h3 className="h6 fw-bold mb-3">Datos de contacto del invitado</h3>
                  <p className="small text-surface-muted">
                    El backend necesita tu nombre y teléfono para crear una reserva sin iniciar sesión.
                  </p>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-nombre" className="form-label small fw-semibold">Nombre</label>
                      <input
                        id="invitado-nombre"
                        className="form-control"
                        autoComplete="given-name"
                        value={nombreInvitado}
                        onChange={(event) => setNombreInvitado(event.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-apellido" className="form-label small fw-semibold">Apellido</label>
                      <input
                        id="invitado-apellido"
                        className="form-control"
                        autoComplete="family-name"
                        value={apellidoInvitado}
                        onChange={(event) => setApellidoInvitado(event.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="invitado-telefono" className="form-label small fw-semibold">Teléfono</label>
                      <input
                        id="invitado-telefono"
                        type="tel"
                        className="form-control"
                        autoComplete="tel"
                        value={telefonoInvitado}
                        onChange={(event) => setTelefonoInvitado(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorContacto && <ErrorMessage message={errorContacto} />}
              <div className="d-flex justify-content-end">
                <Button
                  type="submit"
                  isLoading={crearReserva.isPending || modificarReserva.isPending}
                  loadingText={initialState.reservaId ? 'Guardando cambios...' : 'Confirmando reserva...'}
                  disabled={!fechaSeleccionada || !horaSeleccionada || (Boolean(initialState.reservaId) && !clienteSesion)}
                >
                  {initialState.reservaId ? 'Guardar cambios' : 'Confirmar reserva'}
                </Button>
              </div>
              </form>
            </>
          )}
        </section>
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

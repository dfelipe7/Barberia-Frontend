import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  Moon,
  Scissors,
  Sun,
  Sunset,
  UserRound,
} from 'lucide-react';
import { useServiciosCatalogo } from '../../servicios/api/servicios.facade';
import type { Servicio } from '../../servicios/types/servicios.types';
import { reservasKeys } from '../api/reservas.keys';
import {
  useCrearReserva,
  useDisponibilidadReserva,
  useModificarMiReserva,
  useModificarReservaInvitado,
  useCancelarReservaInvitado,
  usePerfilCliente,
  useCancelarMiReserva,
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
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import BackLink from '../../../shared/ui/BackLink';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useTenantBrand } from '../../negocio/context/TenantBrandContext';
import './ReservaClientePage.css';

interface ReservaLocationState {
  reservaId?: number;
  servicioId?: number;
  barberoId?: number;
  fecha?: string;
  hora?: string;
  origen?: 'servicio' | 'barbero';
  paso?: number;
  desdeLogin?: boolean;
}

type PasoReserva = 1 | 2 | 3 | 4;

interface ReservaBorradorStorage {
  servicioId: number | null;
  barberoId: number | null;
  barberoFijoId: number | null;
  esOrigenBarbero?: boolean;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
  paso: PasoReserva;
  nombreInvitado?: string;
  apellidoInvitado?: string;
  telefonoInvitado?: string;
  reservaId?: number;
}

const STORAGE_KEY_BORRADOR = 'kyrios_reserva_borrador';

const obtenerBorradorStorage = (): ReservaBorradorStorage | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_BORRADOR);
    if (!raw) return null;
    const datos = JSON.parse(raw) as Partial<ReservaBorradorStorage>;
    if (!datos || typeof datos !== 'object') return null;
    return {
      servicioId: typeof datos.servicioId === 'number' ? datos.servicioId : null,
      barberoId: typeof datos.barberoId === 'number' ? datos.barberoId : null,
      barberoFijoId: typeof datos.barberoFijoId === 'number' ? datos.barberoFijoId : null,
      esOrigenBarbero: Boolean(datos.esOrigenBarbero),
      fechaSeleccionada: typeof datos.fechaSeleccionada === 'string' ? datos.fechaSeleccionada : null,
      horaSeleccionada: typeof datos.horaSeleccionada === 'string' ? datos.horaSeleccionada : null,
      paso: (datos.paso === 1 || datos.paso === 2 || datos.paso === 3 || datos.paso === 4 ? datos.paso : 1) as PasoReserva,
      nombreInvitado: typeof datos.nombreInvitado === 'string' ? datos.nombreInvitado : '',
      apellidoInvitado: typeof datos.apellidoInvitado === 'string' ? datos.apellidoInvitado : '',
      telefonoInvitado: typeof datos.telefonoInvitado === 'string' ? datos.telefonoInvitado : '',
      reservaId: typeof datos.reservaId === 'number' ? datos.reservaId : undefined,
    };
  } catch {
    return null;
  }
};

const sanitizarBorradorParaStorage = (datos: ReservaBorradorStorage): ReservaBorradorStorage => ({
  servicioId: typeof datos.servicioId === 'number' && Number.isSafeInteger(datos.servicioId) ? datos.servicioId : null,
  barberoId: typeof datos.barberoId === 'number' && Number.isSafeInteger(datos.barberoId) ? datos.barberoId : null,
  barberoFijoId: typeof datos.barberoFijoId === 'number' && Number.isSafeInteger(datos.barberoFijoId) ? datos.barberoFijoId : null,
  esOrigenBarbero: Boolean(datos.esOrigenBarbero),
  fechaSeleccionada: typeof datos.fechaSeleccionada === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(datos.fechaSeleccionada) ? datos.fechaSeleccionada : null,
  horaSeleccionada: typeof datos.horaSeleccionada === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(datos.horaSeleccionada) ? datos.horaSeleccionada : null,
  paso: (datos.paso === 1 || datos.paso === 2 || datos.paso === 3 || datos.paso === 4 ? datos.paso : 1) as PasoReserva,
  nombreInvitado: typeof datos.nombreInvitado === 'string' ? datos.nombreInvitado.slice(0, 100).replace(/[^\p{L}\s'-]/gu, '').trim() : '',
  apellidoInvitado: typeof datos.apellidoInvitado === 'string' ? datos.apellidoInvitado.slice(0, 100).replace(/[^\p{L}\s'-]/gu, '').trim() : '',
  telefonoInvitado: typeof datos.telefonoInvitado === 'string' ? datos.telefonoInvitado.slice(0, 30).replace(/[^\d+]/g, '').trim() : '',
  reservaId: typeof datos.reservaId === 'number' && Number.isSafeInteger(datos.reservaId) ? datos.reservaId : undefined,
});

const guardarBorradorStorage = (datos: ReservaBorradorStorage | null) => {
  try {
    if (!datos) {
      sessionStorage.removeItem(STORAGE_KEY_BORRADOR);
    } else {
      const payloadSeguro = sanitizarBorradorParaStorage(datos);
      sessionStorage.setItem(STORAGE_KEY_BORRADOR, JSON.stringify(payloadSeguro));
    }
  } catch {
    // Silencioso en caso de restricciones de privacidad
  }
};

const limpiarBorradorStorage = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY_BORRADOR);
  } catch {
    // Silencioso
  }
};

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

interface ValidarConfirmacionParams {
  servicioSeleccionado?: Servicio;
  barberoSeleccionado?: BarberoDisponibleReservaDTO;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
  reservaId?: number | null;
  clienteSesion: any;
  tokenInvitado: string | null;
  nombreInvitado: string;
  apellidoInvitado: string;
  telefonoInvitado: string;
}

function validarConfirmacion(params: ValidarConfirmacionParams): { error?: string; datos?: CrearReservaDTO } {
  const {
    servicioSeleccionado,
    barberoSeleccionado,
    fechaSeleccionada,
    horaSeleccionada,
    reservaId,
    clienteSesion,
    tokenInvitado,
    nombreInvitado,
    apellidoInvitado,
    telefonoInvitado,
  } = params;

  if (!servicioSeleccionado || !barberoSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
    return {};
  }

  if (reservaId && !clienteSesion && !tokenInvitado) {
    return {
      error: 'Para cambiar esta cita, inicia sesión con la cuenta que la reservó o abre esta pestaña donde la creaste.',
    };
  }

  if (!reservaId && !clienteSesion && (!nombreInvitado.trim() || !telefonoInvitado.trim())) {
    return {
      error: 'El nombre y el teléfono son obligatorios para reservar como invitado.',
    };
  }

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

  return { datos };
}

export const ReservaClientePage = () => {
  const confirm = useConfirm();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const { nombreNegocio } = useTenantBrand();
  const effectiveName = nombreNegocio || 'Kyrios Barber Studio';
  const slugActivo = slug || obtenerNegocioSlugActivo() || 'kyrios-studio';
  const initialState = (location.state ?? {}) as ReservaLocationState;
  const queryClient = useQueryClient();
  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();
  const crearReserva = useCrearReserva();
  const modificarReserva = useModificarMiReserva();
  const modificarInvitado = useModificarReservaInvitado();
  const cancelarInvitado = useCancelarReservaInvitado();
  const ventana = useMemo(() => crearVentanaDisponibilidad(), []);
  const fechasDelRango = useMemo(
    () => crearFechasDisponibilidad(ventana.fechaInicio, ventana.fechaFin),
    [ventana.fechaInicio, ventana.fechaFin],
  );
  const totalPaginasFechas = Math.ceil(fechasDelRango.length / 7);

  const idReservaUrl = numeroPositivo(searchParams.get('reservaId'));
  const [reservaId, setReservaId] = useState<number | undefined>(
    () => idReservaUrl ?? numeroPositivo(initialState.reservaId?.toString() ?? null) ?? undefined,
  );

  // Detección de barbero preseleccionado (cuando el usuario inició el flujo eligiendo al barbero)
  const esOrigenBarbero = initialState.origen === 'barbero' || (Boolean(initialState.barberoId) && !initialState.servicioId);
  const idBarberoUrlFijo = numeroPositivo(searchParams.get('barberoFijo'));
  const idBarberoInicialFijo = idBarberoUrlFijo ?? (esOrigenBarbero ? numeroPositivo(initialState.barberoId?.toString() ?? null) : null);

  const idServicioUrl = numeroPositivo(searchParams.get('servicioId'));
  const idServicioInitial = idServicioUrl ?? numeroPositivo(initialState.servicioId?.toString() ?? null);

  const idBarberoUrl = numeroPositivo(searchParams.get('barberoId'));
  const idBarberoInitial = idBarberoUrl ?? (idBarberoInicialFijo ?? numeroPositivo(initialState.barberoId?.toString() ?? null));

  // Obtener borrador de sesión activo ÚNICAMENTE si fue una recarga de la página (F5 / Refresh)
  // o si el usuario regresa tras iniciar sesión. Si navegó desde otra pantalla (Home, Navbar, etc.), se descarta e inicia limpio.
  const borradorSesion = useMemo(() => {
    if (reservaId) return null;

    // Detectar si fue una recarga del navegador (F5 / Refresh)
    const esRecargaNavegador = (() => {
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const timing = navEntries[0] as PerformanceNavigationTiming;
          return timing.type === 'reload';
        }
        return (performance as unknown as { navigation?: { type?: number } }).navigation?.type === 1;
      } catch {
        return false;
      }
    })();

    const esRetornoDeLogin = Boolean(initialState.desdeLogin);

    // Si NO fue recarga ni retorno de login (ej. el usuario navegó desde Inicio o Menú), descartamos cualquier borrador anterior
    if (!esRecargaNavegador && !esRetornoDeLogin) {
      limpiarBorradorStorage();
      return null;
    }

    const guardado = obtenerBorradorStorage();
    if (!guardado) return null;

    // Si viene una navegación explícita con datos diferentes al borrador, prevalece la nueva navegación
    if (idServicioInitial && guardado.servicioId && idServicioInitial !== guardado.servicioId) {
      limpiarBorradorStorage();
      return null;
    }
    if (idBarberoInicialFijo && guardado.barberoFijoId && idBarberoInicialFijo !== guardado.barberoFijoId) {
      limpiarBorradorStorage();
      return null;
    }

    return guardado;
  }, []);

  const [barberoFijoId, setBarberoFijoId] = useState<number | null>(
    () => idBarberoInicialFijo ?? (borradorSesion?.esOrigenBarbero ? borradorSesion.barberoFijoId : null),
  );

  const [servicioId, setServicioId] = useState<number | null>(() => {
    return idServicioInitial ?? borradorSesion?.servicioId ?? null;
  });

  const [barberoId, setBarberoId] = useState<number | null>(() => {
    return idBarberoInitial ?? borradorSesion?.barberoId ?? null;
  });

  // Limpiar la URL al montar para que siempre se vea limpia como /reservar
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(location.state, '', window.location.pathname);
    }
  }, []);

  // Determinación determinista del paso inicial una sola vez al montar
  const pasoInicialCalculado = useMemo<PasoReserva>(() => {
    if (reservaId) return 3;
    if (borradorSesion?.paso) {
      return borradorSesion.paso;
    }
    if (initialState.paso && pasoValido(initialState.paso.toString())) {
      return initialState.paso as PasoReserva;
    }
    const idServ = idServicioInitial ?? borradorSesion?.servicioId;
    const idBarb = idBarberoInitial ?? borradorSesion?.barberoId;

    if (idServ && idBarb && !esOrigenBarbero) return 3;
    if (initialState.servicioId && initialState.barberoId) return 3;
    if (idServ && !idBarb) return 2;
    return 1;
  }, []);

  const [paso, setPaso] = useState<PasoReserva>(() => pasoValido(searchParams.get('paso')) ?? pasoInicialCalculado);

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(
    () => searchParams.get('fecha') || initialState.fecha || borradorSesion?.fechaSeleccionada || null,
  );
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(
    () => searchParams.get('hora') || initialState.hora || borradorSesion?.horaSeleccionada || null,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paso]);

  useEffect(() => {
    const tokenUrl = searchParams.get('token') || (location.state as any)?.token;
    if (reservaId && tokenUrl) {
      reservasService.guardarTokenGestionInvitado(reservaId, tokenUrl);
    }
  }, [reservaId, searchParams, location.state]);

  const [paginaFechas, setPaginaFechas] = useState(() => {
    const fecha = searchParams.get('fecha') || initialState.fecha || borradorSesion?.fechaSeleccionada;
    if (!fecha) return 0;
    const indice = fechasDelRango.indexOf(fecha);
    return indice >= 0 ? Math.floor(indice / 7) : 0;
  });

  const fechasDeLaPagina = fechasDelRango.slice(paginaFechas * 7, paginaFechas * 7 + 7);
  const [reservaCreada, setReservaCreada] = useState<ReservaCreadaDTO | null>(null);
  const [reservaModificada, setReservaModificada] = useState(false);
  const [reservaCancelada, setReservaCancelada] = useState(false);
  const [clienteSesion, setClienteSesion] = useState<ClienteSesionDTO | null>(
    () => clientesService.obtenerSesion(),
  );
  const { data: perfilCliente } = usePerfilCliente(Boolean(clienteSesion));
  const cancelarMiReserva = useCancelarMiReserva();

  useEffect(() => {
    if (perfilCliente?.telefono && !telefonoInvitado) {
      setTelefonoInvitado(perfilCliente.telefono);
    }
  }, [perfilCliente?.telefono]);
  const [nombreInvitado, setNombreInvitado] = useState(
    () => borradorSesion?.nombreInvitado ?? '',
  );
  const [apellidoInvitado, setApellidoInvitado] = useState(
    () => borradorSesion?.apellidoInvitado ?? '',
  );
  const [telefonoInvitado, setTelefonoInvitado] = useState(
    () => borradorSesion?.telefonoInvitado ?? '',
  );
  const [errorContacto, setErrorContacto] = useState<string | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  const copiarCodigoCita = (codigo: string | number) => {
    if (!codigo) return;
    void navigator.clipboard.writeText(String(codigo)).then(() => {
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    });
  };

  // Guardar en sessionStorage el borrador activo para no perder progreso al recargar (F5)
  useEffect(() => {
    if (reservaCreada || reservaCancelada || reservaModificada) {
      limpiarBorradorStorage();
      return;
    }

    if (paso === 1 && !servicioId && !barberoFijoId) {
      limpiarBorradorStorage();
      return;
    }

    guardarBorradorStorage({
      servicioId,
      barberoId,
      barberoFijoId,
      esOrigenBarbero: Boolean(esOrigenBarbero || barberoFijoId),
      fechaSeleccionada,
      horaSeleccionada,
      paso,
      nombreInvitado,
      apellidoInvitado,
      telefonoInvitado,
      reservaId,
    });
  }, [
    servicioId,
    barberoId,
    barberoFijoId,
    esOrigenBarbero,
    fechaSeleccionada,
    horaSeleccionada,
    paso,
    nombreInvitado,
    apellidoInvitado,
    telefonoInvitado,
    reservaId,
    reservaCreada,
    reservaCancelada,
    reservaModificada,
  ]);

  // El catálogo /servicios incluye IDs de Usuario en sus barberos anidados.
  // Para reservas usamos el endpoint dedicado, que devuelve Barbero.id.
  const consultasBarberosPorServicio = useQueries({
    queries: servicios.map((servicio) => ({
      queryKey: reservasKeys.barberosPorServicio(servicio.id),
      queryFn: () => reservasService.obtenerBarberosPorServicio(servicio.id),
      enabled:
        servicio.estado === 'ACTIVO' &&
        (Boolean(barberoFijoId) || (paso >= 2 && servicio.id === servicioId)),
      staleTime: 30_000,
    })),
  });

  const todosLosBarberos = useMemo(() => {
    const mapa = new Map<number, BarberoDisponibleReservaDTO>();
    consultasBarberosPorServicio.forEach((c) => {
      c.data?.forEach((b) => mapa.set(b.id, b));
    });
    return mapa;
  }, [consultasBarberosPorServicio]);

  const barberoFijo = barberoFijoId ? todosLosBarberos.get(barberoFijoId) : null;

  const serviciosActivos = servicios.filter((servicio, index) => {
    if (servicio.estado !== 'ACTIVO') return false;
    // Solo servicios que cuenten con al menos un barbero asignado y activo
    if (!servicio.barberos || servicio.barberos.length === 0) return false;
    if (!barberoFijoId) return true;
    return consultasBarberosPorServicio[index]?.data?.some(
      (barbero) => barbero.id === barberoFijoId,
    );
  });
  const cargandoServiciosDelBarbero = Boolean(barberoFijoId) && servicios.some(
    (servicio, index) =>
      servicio.estado === 'ACTIVO' && consultasBarberosPorServicio[index]?.isLoading,
  );
  const erroresServiciosDelBarbero = Boolean(barberoFijoId) && servicios.some(
    (servicio, index) =>
      servicio.estado === 'ACTIVO' && consultasBarberosPorServicio[index]?.isError,
  );
  const servicioSeleccionado =
    serviciosActivos.find((servicio) => servicio.id === servicioId) ??
    servicios.find((servicio) => servicio.id === servicioId && servicio.estado === 'ACTIVO');
  const indiceConsultaBarberos = servicios.findIndex(
    (servicio) => servicio.id === servicioSeleccionado?.id,
  );
  const consultaBarberosServicio = consultasBarberosPorServicio[indiceConsultaBarberos];
  const barberosDelServicio: BarberoDisponibleReservaDTO[] = consultaBarberosServicio?.data ?? [];
  const barberoSeleccionado =
    barberosDelServicio.find((barbero) => barbero.id === barberoId) ??
    (barberoId ? todosLosBarberos.get(barberoId) : undefined);

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
  const horariosManana = useMemo(
    () => horariosDisponibles.filter((slot) => slot.startTime < '12:00'),
    [horariosDisponibles],
  );
  const horariosTarde = useMemo(
    () => horariosDisponibles.filter((slot) => slot.startTime >= '12:00' && slot.startTime < '17:00'),
    [horariosDisponibles],
  );
  const horariosNoche = useMemo(
    () => horariosDisponibles.filter((slot) => slot.startTime >= '17:00'),
    [horariosDisponibles],
  );
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

  // Auto-seleccionar la primera fecha disponible cuando se ingresa al paso 3
  useEffect(() => {
    if (paso === 3 && !fechaSeleccionada && consultasDisponibilidadFechas.length > 0) {
      const primerIndiceConHoras = consultasDisponibilidadFechas.findIndex(
        (c) => (c.data?.slots.filter((s) => s.available).length ?? 0) > 0,
      );
      if (primerIndiceConHoras !== -1 && fechasDeLaPagina[primerIndiceConHoras]) {
        setFechaSeleccionada(fechasDeLaPagina[primerIndiceConHoras]);
        setHoraSeleccionada(null);
      } else if (
        consultasDisponibilidadFechas.some((c) => c.isSuccess) &&
        fechasDeLaPagina[0]
      ) {
        setFechaSeleccionada(fechasDeLaPagina[0]);
        setHoraSeleccionada(null);
      }
    }
  }, [paso, fechaSeleccionada, consultasDisponibilidadFechas, fechasDeLaPagina]);

  const actualizarParametros = (actualizaciones: Record<string, string | null>) => {
    if ('reservaId' in actualizaciones) {
      setReservaId(numeroPositivo(actualizaciones.reservaId) ?? undefined);
    }
    if ('servicioId' in actualizaciones) {
      setServicioId(numeroPositivo(actualizaciones.servicioId));
    }
    if ('barberoId' in actualizaciones) {
      setBarberoId(numeroPositivo(actualizaciones.barberoId));
    }
    if ('barberoFijo' in actualizaciones) {
      setBarberoFijoId(numeroPositivo(actualizaciones.barberoFijo));
    }
    if ('fecha' in actualizaciones) {
      setFechaSeleccionada(actualizaciones.fecha || null);
    }
    if ('hora' in actualizaciones) {
      setHoraSeleccionada(actualizaciones.hora || null);
    }
    if ('paso' in actualizaciones) {
      const p = pasoValido(actualizaciones.paso);
      if (p) setPaso(p);
    }
  };

  const irAPaso = (
    siguiente: PasoReserva,
    _replace = false,
    valoresExtra: Record<string, string | null> = {},
  ) => {
    setPaso(siguiente);
    actualizarParametros({
      paso: String(siguiente),
      ...valoresExtra,
    });
  };

  const cerrarSesionCliente = () => {
    clientesService.cerrarSesion(slugActivo);
    setClienteSesion(null);
    setReservaCreada(null);
    setReservaModificada(false);
    limpiarBorradorStorage();
    queryClient.removeQueries({ queryKey: reservasKeys.all });
  };

  const cambiarServicio = (servicio: Servicio) => {
    setPaginaFechas(0);
    setReservaCreada(null);
    setReservaModificada(false);
    setReservaCancelada(false);
    setServicioId(servicio.id);
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
  };

  const seleccionarBarbero = (barbero: BarberoDisponibleReservaDTO) => {
    setPaginaFechas(0);
    setReservaCreada(null);
    setReservaModificada(false);
    setReservaCancelada(false);
    setBarberoId(barbero.id);
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
  };

  const continuarDesdeServicio = () => {
    if (!servicioSeleccionado) return;
    if (barberoFijoId) {
      irAPaso(3, false, {
        servicioId: String(servicioSeleccionado.id),
        barberoId: String(barberoFijoId),
        fecha: null,
        hora: null,
      });
    } else {
      irAPaso(2, false, {
        servicioId: String(servicioSeleccionado.id),
        barberoId: null,
        fecha: null,
        hora: null,
      });
    }
  };

  const continuarDesdeBarbero = () => {
    if (!barberoSeleccionado) return;
    setPaginaFechas(0);
    irAPaso(3, false, {
      barberoId: String(barberoSeleccionado.id),
      servicioId: servicioId ? String(servicioId) : null,
      fecha: null,
      hora: null,
    });
  };

  const volverPaso = () => {
    setErrorContacto(null);
    if (paso === 3 && barberoFijoId) {
      irAPaso(1);
      return;
    }
    irAPaso(Math.max(1, paso - 1) as PasoReserva);
  };

  const confirmarReserva = async () => {
    const tokenInvitado = reservaId
      ? reservasService.obtenerTokenGestionInvitado(reservaId) ||
        searchParams.get('token') ||
        (location.state as any)?.token
      : null;

    const validacion = validarConfirmacion({
      servicioSeleccionado,
      barberoSeleccionado,
      fechaSeleccionada,
      horaSeleccionada,
      reservaId,
      clienteSesion,
      tokenInvitado,
      nombreInvitado,
      apellidoInvitado,
      telefonoInvitado,
    });

    if (validacion.error) {
      setErrorContacto(validacion.error);
      return;
    }
    if (!validacion.datos) {
      return;
    }

    setErrorContacto(null);

    try {
      if (reservaId) {
        const datosModificados = {
          barberoId: barberoSeleccionado!.id,
          fecha: fechaSeleccionada!,
          hora: horaSeleccionada!,
        };
        if (clienteSesion) {
          await modificarReserva.mutateAsync({ id: reservaId, datos: datosModificados });
        } else if (tokenInvitado) {
          await modificarInvitado.mutateAsync({ id: reservaId, token: tokenInvitado, datos: datosModificados });
        }
        limpiarBorradorStorage();
        setReservaModificada(true);
      } else {
        const resultado = await crearReserva.mutateAsync(validacion.datos);
        limpiarBorradorStorage();
        if (resultado.tokenGestion) {
          reservasService.guardarTokenGestionInvitado(resultado.id, resultado.tokenGestion);
        }
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

  const errorConfirmacion = reservaId
    ? (clienteSesion ? modificarReserva.error : modificarInvitado.error)
    : crearReserva.error;
  const conflictoReserva = isAxiosError(errorConfirmacion) && errorConfirmacion.response?.status === 409;
  const rutaActual = location.pathname + location.search;

        const cancelarReservaDeClienteAutenticado = async () => {
    const idCita = reservaCreada?.id ?? reservaId;
    if (!idCita) return;

    const nombreServicio = servicioSeleccionado?.nombre ?? reservaCreada?.servicio?.nombre ?? 'Cita agendada';
    const fechaTexto = fechaSeleccionada ?? reservaCreada?.fecha ?? '';
    const horaTexto = horaSeleccionada ?? reservaCreada?.hora ?? '';

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
            <div className="fw-bold text-surface-primary mb-1">{nombreServicio}</div>
            {fechaTexto && horaTexto && (
              <div className="small text-surface-muted">Fecha y hora: {fechaTexto} · {horaTexto}</div>
            )}
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

    if (!confirmado) return;

    try {
      await cancelarMiReserva.mutateAsync(idCita);
      limpiarBorradorStorage();
      setReservaCreada(null);
      setReservaModificada(false);
      setReservaId(undefined);
      setReservaCancelada(true);
      setBarberoFijoId(null);
      setFechaSeleccionada(null);
      setHoraSeleccionada(null);
      irAPaso(1, false, {
        paso: '1',
        reservaId: null,
        servicioId: null,
        barberoId: null,
        barberoFijo: null,
        fecha: null,
        hora: null,
        token: null,
      });
    } catch (error: unknown) {
      await confirm({
        title: 'Error al cancelar',
        message: mapApiError(error),
        confirmLabel: 'Entendido',
        variant: 'danger',
      });
    }
  };

  const cancelarReservaDeInvitado = async () => {
    const idCita = reservaCreada?.id ?? reservaId;
    if (!idCita || clienteSesion) return;

    const token =
      reservaCreada?.tokenGestion ||
      reservasService.obtenerTokenGestionInvitado(idCita) ||
      searchParams.get('token');

    if (!token) {
      await confirm({
        title: 'No se puede cancelar',
        message: 'No se encontró la credencial de seguridad en esta pestaña para cancelar la cita. Puedes abrir el enlace enviado por WhatsApp para gestionarla.',
        confirmLabel: 'Entendido',
        variant: 'danger',
      });
      return;
    }

    const nombreServicio =
      servicioSeleccionado?.nombre ?? reservaCreada?.servicio?.nombre ?? 'Cita agendada';
    const nombreBarbero = barberoSeleccionado
      ? `${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}`
      : reservaCreada?.barbero
        ? `${reservaCreada.barbero.nombre} ${reservaCreada.barbero.apellido}`
        : 'Barbero asignado';
    const fechaTexto = fechaSeleccionada ?? reservaCreada?.fecha ?? '';
    const horaTexto = horaSeleccionada ?? reservaCreada?.hora ?? '';

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
              {nombreServicio}
            </div>
            <div className="small text-surface-muted mb-1">
              Barbero: <strong>{nombreBarbero}</strong>
            </div>
            {fechaTexto && horaTexto && (
              <div className="small text-surface-muted">
                Fecha y hora: {fechaTexto} · {horaTexto}
              </div>
            )}
          </div>
          <p className="small text-danger mb-0">
            El horario quedará liberado inmediatamente para que otros clientes puedan reservarlo.
          </p>
        </div>
      ),
      confirmLabel: 'Sí, cancelar cita',
      cancelLabel: 'Conservar cita',
      variant: 'danger',
    });

    if (!confirmado) return;

    try {
      await cancelarInvitado.mutateAsync({ id: idCita, token });
      reservasService.eliminarTokenGestionInvitado(idCita);
      limpiarBorradorStorage();
      setReservaCreada(null);
      setReservaModificada(false);
      setReservaId(undefined);
      setReservaCancelada(true);
      setBarberoFijoId(null);
      setFechaSeleccionada(null);
      setHoraSeleccionada(null);
      irAPaso(1, false, {
        paso: '1',
        reservaId: null,
        servicioId: null,
        barberoId: null,
        barberoFijo: null,
        fecha: null,
        hora: null,
        token: null,
      });
    } catch (error: unknown) {
      await confirm({
        title: 'Error al cancelar',
        message: mapApiError(error),
        confirmLabel: 'Entendido',
        variant: 'danger',
      });
    }
  };

  const cambiarReservaDeInvitado = () => {
    const idCita = reservaId ?? reservaCreada?.id;
    if (!idCita) return;
    const token =
      reservaCreada?.tokenGestion ||
      reservasService.obtenerTokenGestionInvitado(idCita);
    if (token) {
      reservasService.guardarTokenGestionInvitado(idCita, token);
    }
    const servId = servicioSeleccionado?.id ?? reservaCreada?.servicio?.id;
    const barbId = barberoSeleccionado?.id ?? reservaCreada?.barbero?.id;

    setReservaId(idCita);
    setReservaCreada(null);
    setReservaModificada(false);
    setReservaCancelada(false);
    setHoraSeleccionada(null);

    irAPaso(3, false, {
      paso: '3',
      reservaId: String(idCita),
      servicioId: servId ? String(servId) : null,
      barberoId: barbId ? String(barbId) : null,
      token: token ?? null,
      fecha: fechaSeleccionada ?? reservaCreada?.fecha ?? null,
      hora: null,
    });
  };

  const cambiarBarberoDeInvitado = () => {
    const idCita = reservaId ?? reservaCreada?.id;
    if (!idCita) return;
    const token =
      reservaCreada?.tokenGestion ||
      reservasService.obtenerTokenGestionInvitado(idCita);
    if (token) {
      reservasService.guardarTokenGestionInvitado(idCita, token);
    }
    const servId = servicioSeleccionado?.id ?? reservaCreada?.servicio?.id;

    setReservaId(idCita);
    setReservaCreada(null);
    setReservaModificada(false);
    setReservaCancelada(false);
    setBarberoId(null);
    setBarberoFijoId(null);
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);

    irAPaso(2, false, {
      paso: '2',
      reservaId: String(idCita),
      servicioId: servId ? String(servId) : null,
      barberoId: null,
      barberoFijo: null,
      token: token ?? null,
      fecha: null,
      hora: null,
    });
  };

  return (
    <main className="booking-flow container py-4 py-lg-5" style={{ maxWidth: '1080px' }}>
      <header className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <BackLink to={`/${slugActivo}`} onClick={limpiarBorradorStorage}>Volver al sitio público</BackLink>
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

      {reservaCancelada && (
        <div className="alert alert-success d-flex align-items-center justify-content-between p-3 rounded-3 mb-4 shadow-sm" role="status">
          <div>
            <strong className="d-block">✓ Tu cita fue cancelada exitosamente</strong>
            <span className="small">La franja horaria fue liberada. Si deseas, puedes agendar un nuevo turno a continuación.</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setReservaCancelada(false)} aria-label="Cerrar" />
        </div>
      )}

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
                to={'/' + slugActivo + '/cliente/iniciar-sesion?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Iniciar sesión
              </Link>
              <Link
                className="btn btn-primary"
                to={'/' + slugActivo + '/cliente/registro?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </section>

      {clienteSesion && <MisReservasSection />}

      <nav aria-label="Pasos de la reserva" className="mb-4 booking-stepper-container">
        <div className="booking-stepper-segments" aria-hidden="true">
          <div className={`booking-stepper-segment ${paso >= 1 ? 'is-active' : ''}`} />
          <div className={`booking-stepper-segment ${paso >= 2 || Boolean(barberoFijoId) ? 'is-active' : ''}`} />
          <div className={`booking-stepper-segment ${paso >= 3 ? 'is-active' : ''}`} />
          <div className={`booking-stepper-segment ${paso >= 4 ? 'is-active' : ''}`} />
        </div>
        <ol className="booking-stepper list-unstyled d-flex justify-content-between mb-0">
          {[
            { numero: 1, label: 'Servicio', icono: <Scissors size={15} /> },
            { numero: 2, label: 'Barbero', icono: <UserRound size={15} /> },
            { numero: 3, label: 'Fecha y hora', icono: <CalendarDays size={15} /> },
            { numero: 4, label: (reservaCreada || reservaModificada) ? 'Confirmada' : 'Confirmar', icono: <Check size={15} /> },
          ].map((item) => {
            const estaCompletado = paso > item.numero || (item.numero === 2 && Boolean(barberoFijoId)) || (item.numero === 4 && Boolean(reservaCreada || reservaModificada));
            const esActual = paso === item.numero;
            const habilitado = !reservaCreada && !reservaModificada && (item.numero <= paso || (item.numero === 2 && Boolean(barberoFijoId)));

            return (
              <li key={item.numero} className="booking-stepper__item">
                <button
                  type="button"
                  className={'booking-stepper__step ' + (
                    esActual
                      ? 'is-current'
                      : estaCompletado
                        ? 'is-done'
                        : ''
                  )}
                  aria-current={esActual ? 'step' : undefined}
                  disabled={!habilitado}
                  onClick={() => {
                    if (item.numero === 1) {
                      if (!barberoFijoId) {
                        irAPaso(1, false, { barberoId: null });
                      } else {
                        irAPaso(1);
                      }
                    } else if (item.numero === 2) {
                      irAPaso(2);
                    } else if (item.numero === 3) {
                      irAPaso(3);
                    } else if (item.numero === 4) {
                      irAPaso(4);
                    }
                  }}
                >
                  <span className="booking-stepper__icon-wrap">
                    {estaCompletado && !esActual ? <Check size={14} className="booking-stepper__check" /> : item.icono}
                  </span>
                  <span className="booking-stepper__label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {paso === 1 && (
        <section aria-labelledby="seleccionar-servicio-titulo" className="booking-section">
          <div className="booking-section-header mb-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="booking-step-badge">Paso 1</span>
              <h2 id="seleccionar-servicio-titulo" className="h4 fw-bold mb-0">
                Elige un servicio
              </h2>
            </div>
            <p className="small text-surface-muted mb-0">
              Selecciona el servicio que deseas agendar. Cada opción detalla duración y tarifa.
            </p>
          </div>

          {barberoFijo && (
            <div className="booking-fixed-banner alert d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div className="d-flex align-items-center gap-2">
                <UserRound size={18} className="text-primary flex-shrink-0" />
                <span>
                  Reservando con <strong>{barberoFijo.nombre} {barberoFijo.apellido}</strong>. Mostrando los servicios que este barbero realiza.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setBarberoFijoId(null);
                  actualizarParametros({ barberoFijo: null, barberoId: null });
                }}
              >
                Ver todos los servicios
              </button>
            </div>
          )}

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
                  <div className="col-12 col-sm-6 col-lg-4" key={servicio.id}>
                    <button
                      type="button"
                      className={'booking-card booking-service-card card card-surface w-100 h-100 text-start p-0 overflow-hidden ' + (
                        seleccionado ? 'booking-card--selected' : ''
                      )}
                      aria-pressed={seleccionado}
                      onClick={() => cambiarServicio(servicio)}
                    >
                      {seleccionado && (
                        <span className="booking-card__check-indicator" aria-hidden="true">
                          <Check size={14} />
                        </span>
                      )}
                      {foto ? (
                        <div
                          className="booking-card__media position-relative overflow-hidden w-100 d-flex align-items-center justify-content-center"
                          style={{ height: '136px', background: '#0d0d0d' }}
                        >
                          <img
                            src={foto}
                            alt=""
                            aria-hidden="true"
                            className="position-absolute"
                            style={{
                              inset: '-10px',
                              width: 'calc(100% + 20px)',
                              height: 'calc(100% + 20px)',
                              objectFit: 'cover',
                              filter: 'blur(10px) brightness(0.35)',
                              transform: 'scale(1.15)',
                              pointerEvents: 'none',
                            }}
                          />
                          <img
                            src={foto}
                            alt=""
                            className="position-relative booking-card__img"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              zIndex: 1,
                              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                            }}
                            loading="lazy"
                          />
                          <span className="booking-card__duration-badge">
                            <Clock3 size={12} />
                            {servicio.duracionMinutos} min
                          </span>
                        </div>
                      ) : (
                        <div
                          className="booking-card__media position-relative d-flex align-items-center justify-content-center bg-body-secondary"
                          style={{ height: '136px' }}
                          aria-hidden="true"
                        >
                          <Scissors size={32} className="text-surface-muted" />
                          <span className="booking-card__duration-badge">
                            <Clock3 size={12} />
                            {servicio.duracionMinutos} min
                          </span>
                        </div>
                      )}
                      <div className="card-body d-flex flex-column p-3">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                          <span className="h6 fw-bold mb-0 text-truncate">{servicio.nombre}</span>
                        </div>
                        <p className="booking-flow__service-description small text-surface-muted flex-grow-1 mb-3">
                          {servicio.descripcion || 'Servicio profesional de barbería con atención de primer nivel.'}
                        </p>
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                          <span className="small text-surface-muted">Precio</span>
                          <span className="booking-card__price fw-bold text-primary">
                            {formatearPrecio(servicio.precio)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {paso === 2 && (isLoading || !servicioSeleccionado) && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
          <KyriosSpinner size="md" />
          <span className="small text-surface-muted mt-2">Cargando datos del servicio...</span>
        </div>
      )}

      {paso === 2 && servicioSeleccionado && (
        <section aria-labelledby="seleccionar-barbero-titulo" className="booking-section">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="booking-step-badge">Paso 2</span>
                <h2 id="seleccionar-barbero-titulo" className="h4 fw-bold mb-0">
                  Elige a tu barbero
                </h2>
              </div>
              <p className="small text-surface-muted mb-0">
                Profesionales certificados para {servicioSeleccionado.nombre}.
              </p>
            </div>
            {!reservaId && (
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                onClick={() => irAPaso(1, false, { barberoId: null })}
              >
                Cambiar servicio
              </Button>
            )}
          </div>

          {consultaBarberosServicio?.isLoading && (
            <div className="d-flex justify-content-center py-5" role="status">
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
                      className={'booking-card booking-barber-card card card-surface w-100 h-100 text-center p-4 ' + (
                        seleccionado ? 'booking-card--selected' : ''
                      )}
                      aria-pressed={seleccionado}
                      onClick={() => seleccionarBarbero(barbero)}
                    >
                      {seleccionado && (
                        <span className="booking-card__check-indicator" aria-hidden="true">
                          <Check size={14} />
                        </span>
                      )}
                      <div className="booking-barber-avatar-wrap mx-auto mb-3">
                        {foto ? (
                          <img
                            src={foto}
                            alt=""
                            className="booking-barber-avatar rounded-circle object-fit-cover"
                            style={{ width: '92px', height: '92px' }}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="booking-barber-avatar rounded-circle bg-body-secondary d-flex align-items-center justify-content-center"
                            style={{ width: '92px', height: '92px' }}
                            aria-hidden="true"
                          >
                            <UserRound size={36} className="text-surface-muted" />
                          </span>
                        )}
                      </div>
                      <span className="booking-barber-name fw-bold d-block text-truncate mb-1">
                        {barbero.nombre} {barbero.apellido}
                      </span>
                      <span className="booking-barber-role small text-surface-muted d-block mb-3">
                        Master Barber · Profesional
                      </span>
                      <div className="mt-auto">
                        <span
                          className={`badge rounded-pill booking-barber-status-badge ${
                            seleccionado
                              ? 'booking-barber-status-badge--selected'
                              : 'booking-barber-status-badge--available'
                          }`}
                        >
                          {seleccionado ? 'Seleccionado' : 'Disponible'}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {paso === 3 && (isLoading || consultaBarberosServicio?.isLoading || !servicioSeleccionado || !barberoSeleccionado) && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
          <KyriosSpinner size="md" />
          <span className="small text-surface-muted mt-2">Cargando disponibilidad y horarios...</span>
        </div>
      )}

      {paso === 3 && servicioSeleccionado && barberoSeleccionado && (
        <section aria-labelledby="seleccionar-fecha-titulo" className="booking-section">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="booking-step-badge">Paso 3</span>
                <h2 id="seleccionar-fecha-titulo" className="h4 fw-bold mb-0">
                  Elige fecha y hora
                </h2>
              </div>
              <p className="small text-surface-muted mb-0">
                Disponibilidad de agenda para <strong>{barberoSeleccionado.nombre}</strong>.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  if (barberoFijoId) {
                    setBarberoFijoId(null);
                    irAPaso(2, false, { barberoFijo: null, barberoId: null, fecha: null, hora: null });
                  } else {
                    irAPaso(2, false, { barberoId: null, barberoFijo: null, fecha: null, hora: null });
                  }
                }}
              >
                Cambiar barbero
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                onClick={() => irAPaso(1, false, { fecha: null, hora: null })}
              >
                Cambiar servicio
              </Button>
            </div>
          </div>

          {/* Carrusel de fechas de la semana */}
          <div className="booking-calendar-card card-surface p-3 p-md-4 rounded-3 mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <span className="fw-semibold small">Fechas de atención (próximos 30 días)</span>
              </div>
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
                <span className="small text-surface-muted px-1" aria-live="polite">
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

            <div className="booking-date-carousel" role="group" aria-label="Fechas con disponibilidad">
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
                    className={'booking-date-capsule ' + (
                      seleccionada ? 'booking-date-capsule--selected' : ''
                    )}
                    aria-pressed={seleccionada}
                    aria-label={`${etiquetasFecha.semana} ${etiquetasFecha.numero} de ${etiquetasFecha.mes}: ${cantidadHorarios} horarios disponibles`}
                    disabled={deshabilitada}
                    onClick={() => {
                      setFechaSeleccionada(fecha);
                      setHoraSeleccionada(null);
                    }}
                  >
                    <span className="booking-date-capsule__day">{etiquetasFecha.semana}</span>
                    <span className="booking-date-capsule__num">{etiquetasFecha.numero}</span>
                    <span className="booking-date-capsule__month">{etiquetasFecha.mes}</span>
                    <span className="booking-date-capsule__status">
                      {consulta?.isLoading ? (
                        '···'
                      ) : consulta?.isError ? (
                        '—'
                      ) : cantidadHorarios > 0 ? (
                        <span className="booking-date-capsule__badge">{cantidadHorarios} disp.</span>
                      ) : (
                        <span className="booking-date-capsule__empty">Sin turnos</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
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
            <div className="alert alert-light border rounded-3 p-3 mb-0 text-center">
              <p className="mb-0 text-surface-muted">
                No hay turnos disponibles para <strong>{formatearFecha(fechaSeleccionada)}</strong> con {barberoSeleccionado.nombre}. Te invitamos a seleccionar otro día con disponibilidad.
              </p>
            </div>
          )}

          {fechaSeleccionada && !disponibilidad.isLoading && !disponibilidad.error && horariosDisponibles.length > 0 && (
            <div className="booking-slots-container mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h3 className="h6 fw-bold mb-0 text-capitalize">
                    Horas disponibles · {formatearFecha(fechaSeleccionada)}
                  </h3>
                  <span className="small text-surface-muted">
                    {horariosDisponibles.length} {horariosDisponibles.length === 1 ? 'horario disponible' : 'horarios disponibles'} para este día
                  </span>
                </div>
              </div>

              {/* Bloques temáticos de jornada: Mañana, Tarde, Noche */}
              <div className="booking-dayparts-grid d-flex flex-column gap-3">
                {horariosManana.length > 0 && (
                  <div className="booking-daypart-card card-surface p-3 rounded-3">
                    <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="booking-daypart-icon booking-daypart-icon--morning">
                          <Sun size={17} />
                        </span>
                        <div>
                          <strong className="booking-daypart-title">Mañana</strong>
                          <span className="booking-daypart-range small text-surface-muted ms-2">09:00 – 12:00</span>
                        </div>
                      </div>
                      <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                        {horariosManana.length} {horariosManana.length === 1 ? 'hora' : 'horas'}
                      </span>
                    </div>
                    <div className="booking-slots-grid">
                      {horariosManana.map((slot) => {
                        const activo = slot.startTime === horaSeleccionada;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            className={`booking-slot-pill ${activo ? 'booking-slot-pill--active' : ''}`}
                            aria-pressed={activo}
                            onClick={() => setHoraSeleccionada(slot.startTime)}
                          >
                            <span className="booking-slot-time">{slot.startTime}</span>
                            <span className="booking-slot-end">a {slot.endTime}</span>
                            {activo && <Check size={13} className="booking-slot-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {horariosTarde.length > 0 && (
                  <div className="booking-daypart-card card-surface p-3 rounded-3">
                    <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="booking-daypart-icon booking-daypart-icon--afternoon">
                          <Sunset size={17} />
                        </span>
                        <div>
                          <strong className="booking-daypart-title">Tarde</strong>
                          <span className="booking-daypart-range small text-surface-muted ms-2">12:00 – 17:00</span>
                        </div>
                      </div>
                      <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                        {horariosTarde.length} {horariosTarde.length === 1 ? 'hora' : 'horas'}
                      </span>
                    </div>
                    <div className="booking-slots-grid">
                      {horariosTarde.map((slot) => {
                        const activo = slot.startTime === horaSeleccionada;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            className={`booking-slot-pill ${activo ? 'booking-slot-pill--active' : ''}`}
                            aria-pressed={activo}
                            onClick={() => setHoraSeleccionada(slot.startTime)}
                          >
                            <span className="booking-slot-time">{slot.startTime}</span>
                            <span className="booking-slot-end">a {slot.endTime}</span>
                            {activo && <Check size={13} className="booking-slot-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {horariosNoche.length > 0 && (
                  <div className="booking-daypart-card card-surface p-3 rounded-3">
                    <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="booking-daypart-icon booking-daypart-icon--night">
                          <Moon size={17} />
                        </span>
                        <div>
                          <strong className="booking-daypart-title">Noche</strong>
                          <span className="booking-daypart-range small text-surface-muted ms-2">17:00 – 20:00</span>
                        </div>
                      </div>
                      <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                        {horariosNoche.length} {horariosNoche.length === 1 ? 'hora' : 'horas'}
                      </span>
                    </div>
                    <div className="booking-slots-grid">
                      {horariosNoche.map((slot) => {
                        const activo = slot.startTime === horaSeleccionada;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            className={`booking-slot-pill ${activo ? 'booking-slot-pill--active' : ''}`}
                            aria-pressed={activo}
                            onClick={() => setHoraSeleccionada(slot.startTime)}
                          >
                            <span className="booking-slot-time">{slot.startTime}</span>
                            <span className="booking-slot-end">a {slot.endTime}</span>
                            {activo && <Check size={13} className="booking-slot-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {paso === 4 && (isLoading || consultaBarberosServicio?.isLoading || !servicioSeleccionado || !barberoSeleccionado) && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
          <KyriosSpinner size="md" />
          <span className="small text-surface-muted mt-2">Cargando datos de tu reserva...</span>
        </div>
      )}

      {paso === 4 && servicioSeleccionado && barberoSeleccionado && (
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

          {errorConfirmacion && (
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
                    onClick={() => {
                      limpiarBorradorStorage();
                      setReservaCreada(null);
                      setReservaModificada(false);
                      setServicioId(null);
                      setBarberoId(null);
                      setBarberoFijoId(null);
                      setFechaSeleccionada(null);
                      setHoraSeleccionada(null);
                      setNombreInvitado('');
                      setApellidoInvitado('');
                      setTelefonoInvitado('');
                      irAPaso(1, false, {
                        paso: '1',
                        servicioId: null,
                        barberoId: null,
                        barberoFijo: null,
                        fecha: null,
                        hora: null,
                        reservaId: null,
                      });
                    }}
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
                        disabled={!fechaSeleccionada || !horaSeleccionada || (reservaId !== undefined && !clienteSesion && !reservasService.obtenerTokenGestionInvitado(reservaId))}
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
      )}

      

      {/* Barra flotante inferior de acción continua */}
      {paso === 1 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 1 · Servicio</span>
              <div className="d-flex align-items-center gap-2">
                <strong className="booking-floating-bar__title">
                  {servicioSeleccionado ? servicioSeleccionado.nombre : 'Elige un servicio para continuar'}
                </strong>
                {servicioSeleccionado && (
                  <span className="badge booking-primary-badge">
                    {formatearPrecio(servicioSeleccionado.precio)}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!servicioSeleccionado}
              onClick={continuarDesdeServicio}
              icon={<ChevronRight size={18} />}
            >
              {barberoFijoId ? 'Elegir fecha y hora' : 'Elegir barbero'}
            </Button>
          </div>
        </aside>
      )}

      {paso === 2 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 2 · Barbero</span>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <strong className="booking-floating-bar__title">
                  {servicioSeleccionado?.nombre}
                </strong>
                <span className="text-surface-muted">·</span>
                <span className="text-primary fw-semibold">
                  {barberoSeleccionado ? `${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}` : 'Elige tu barbero'}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!barberoSeleccionado}
              onClick={continuarDesdeBarbero}
              icon={<ChevronRight size={18} />}
            >
              Elegir fecha y hora
            </Button>
          </div>
        </aside>
      )}

      {paso === 3 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 3 · Agenda</span>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <strong className="booking-floating-bar__title">
                  {fechaSeleccionada ? formatearFecha(fechaSeleccionada) : 'Selecciona una fecha'}
                </strong>
                {horaSeleccionada && (
                  <>
                    <span className="text-surface-muted">·</span>
                    <span className="badge booking-primary-badge">{horaSeleccionada}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!fechaSeleccionada || !horaSeleccionada}
              onClick={() => irAPaso(4)}
              icon={<ChevronRight size={18} />}
            >
              Continuar al resumen
            </Button>
          </div>
        </aside>
      )}

      {paso > 1 && !reservaCreada && !reservaModificada && (
        <div className="mt-4 pt-3 border-top small text-surface-muted">
          <span className="fw-semibold">Tu selección:</span>{' '}
          {servicioSeleccionado?.nombre ?? 'elige un servicio'}
          {barberoSeleccionado ? ' · ' + barberoSeleccionado.nombre + ' ' + barberoSeleccionado.apellido : ''}
          {fechaSeleccionada ? ' · ' + formatearFecha(fechaSeleccionada) : ''}
          {horaSeleccionada ? ' · ' + horaSeleccionada : ''}
        </div>
      )}

      {/* Espaciador inferior para que la barra flotante nunca cubra la parte inferior de la vista */}
      <div className="booking-flow__bottom-spacer" aria-hidden="true" />
    </main>
  );
};

export default ReservaClientePage;

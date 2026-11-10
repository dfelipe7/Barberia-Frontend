import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
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
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useTenantBrand } from '../../negocio/context/TenantBrandContext';
import BookingStepper, { type PasoReserva } from '../components/BookingStepper';
import BookingFloatingBar from '../components/BookingFloatingBar';
import StepServicios from '../components/StepServicios';
import StepBarberos from '../components/StepBarberos';
import StepAgenda, { type JornadaHorario } from '../components/StepAgenda';
import StepConfirmacion from '../components/StepConfirmacion';
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

const sanitizarEnteroSeguro = (val: unknown): number | null =>
  typeof val === 'number' && Number.isSafeInteger(val) ? val : null;

const sanitizarTextoSeguro = (val: unknown, maxLen: number, regex: RegExp): string => {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).replace(regex, '').trim();
};

const sanitizarFechaHora = (val: unknown, regex: RegExp): string | null =>
  typeof val === 'string' && regex.test(val) ? val : null;

const sanitizarPaso = (paso: unknown): PasoReserva =>
  paso === 1 || paso === 2 || paso === 3 || paso === 4 ? paso : 1;

const sanitizarBorradorParaStorage = (datos: ReservaBorradorStorage): ReservaBorradorStorage => ({
  servicioId: sanitizarEnteroSeguro(datos.servicioId),
  barberoId: sanitizarEnteroSeguro(datos.barberoId),
  barberoFijoId: sanitizarEnteroSeguro(datos.barberoFijoId),
  esOrigenBarbero: Boolean(datos.esOrigenBarbero),
  fechaSeleccionada: sanitizarFechaHora(datos.fechaSeleccionada, /^\d{4}-\d{2}-\d{2}$/),
  horaSeleccionada: sanitizarFechaHora(datos.horaSeleccionada, /^\d{2}:\d{2}(:\d{2})?$/),
  paso: sanitizarPaso(datos.paso),
  nombreInvitado: sanitizarTextoSeguro(datos.nombreInvitado, 100, /[^\p{L}\s'-]/gu),
  apellidoInvitado: sanitizarTextoSeguro(datos.apellidoInvitado, 100, /[^\p{L}\s'-]/gu),
  telefonoInvitado: sanitizarTextoSeguro(datos.telefonoInvitado, 30, /[^\d+]/g),
  reservaId: sanitizarEnteroSeguro(datos.reservaId) ?? undefined,
});

const obtenerBorradorStorage = (): ReservaBorradorStorage | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_BORRADOR);
    if (!raw) return null;
    const jsonStr = raw.startsWith('%') ? decodeURIComponent(raw) : raw;
    const datos = JSON.parse(jsonStr) as Partial<ReservaBorradorStorage>;
    if (!datos || typeof datos !== 'object') return null;
    return sanitizarBorradorParaStorage({
      servicioId: datos.servicioId ?? null,
      barberoId: datos.barberoId ?? null,
      barberoFijoId: datos.barberoFijoId ?? null,
      esOrigenBarbero: Boolean(datos.esOrigenBarbero),
      fechaSeleccionada: datos.fechaSeleccionada ?? null,
      horaSeleccionada: datos.horaSeleccionada ?? null,
      paso: (datos.paso ?? 1) as PasoReserva,
      nombreInvitado: datos.nombreInvitado ?? '',
      apellidoInvitado: datos.apellidoInvitado ?? '',
      telefonoInvitado: datos.telefonoInvitado ?? '',
      reservaId: datos.reservaId,
    });
  } catch {
    return null;
  }
};

const guardarBorradorStorage = (datos: ReservaBorradorStorage | null) => {
  try {
    if (!datos) {
      sessionStorage.removeItem(STORAGE_KEY_BORRADOR);
      return;
    }
    const payloadSeguro = sanitizarBorradorParaStorage(datos);
    const serialized = encodeURIComponent(JSON.stringify(payloadSeguro));
    sessionStorage.setItem(STORAGE_KEY_BORRADOR, serialized);
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
    () => clientesService.obtenerSesion(slugActivo),
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

  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<JornadaHorario>('manana');

  useEffect(() => {
    if (horaSeleccionada) {
      if (horaSeleccionada < '12:00') setJornadaSeleccionada('manana');
      else if (horaSeleccionada < '17:00') setJornadaSeleccionada('tarde');
      else setJornadaSeleccionada('noche');
    } else if (horariosDisponibles.length > 0) {
      if (horariosManana.length > 0) setJornadaSeleccionada('manana');
      else if (horariosTarde.length > 0) setJornadaSeleccionada('tarde');
      else if (horariosNoche.length > 0) setJornadaSeleccionada('noche');
    }
  }, [fechaSeleccionada, horaSeleccionada, horariosDisponibles.length, horariosManana.length, horariosTarde.length, horariosNoche.length]);
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
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary flex-shrink-0"
              style={{ width: 42, height: 42 }}
              aria-hidden="true"
            >
              <UserRound size={20} />
            </div>
            <div>
              {clienteSesion ? (
                <>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h2 className="h6 fw-bold mb-0">
                      {clienteSesion.nombre} {clienteSesion.apellido ?? ''}
                    </h2>
                    <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                      Sesión activa
                    </span>
                  </div>
                  <p className="small text-surface-muted mb-0">
                    Tus reservas quedarán guardadas automáticamente en tu cuenta.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="h6 fw-bold mb-1">Reserva como invitado o con tu cuenta</h2>
                  <p className="small text-surface-muted mb-0">
                    Con tu cuenta podrás consultar y cambiar tus citas en cualquier momento.
                  </p>
                </>
              )}
            </div>
          </div>
          {clienteSesion ? (
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Link
                to={`/${slugActivo}/cliente/mi-cuenta`}
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
              >
                <CalendarDays size={15} aria-hidden="true" />
                <span>Mi Portal · Mis Citas</span>
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={cerrarSesionCliente}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              <Link
                className="btn btn-outline-secondary btn-sm"
                to={'/' + slugActivo + '/cliente/iniciar-sesion?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Iniciar sesión
              </Link>
              <Link
                className="btn btn-primary btn-sm"
                to={'/' + slugActivo + '/cliente/registro?returnTo=' + encodeURIComponent(rutaActual)}
                state={{ returnTo: rutaActual }}
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </section>

      <BookingStepper
        paso={paso}
        barberoFijoId={barberoFijoId}
        reservaCreada={Boolean(reservaCreada)}
        reservaModificada={Boolean(reservaModificada)}
        irAPaso={irAPaso}
      />

      {paso === 1 && (
        <StepServicios
          barberoFijo={barberoFijo ?? null}
          onClearBarberoFijo={() => {
            setBarberoFijoId(null);
            actualizarParametros({ barberoFijo: null, barberoId: null });
          }}
          isLoading={isLoading}
          cargandoServiciosDelBarbero={Boolean(cargandoServiciosDelBarbero)}
          erroresServiciosDelBarbero={Boolean(erroresServiciosDelBarbero)}
          isFetchingConsultasBarberos={consultasBarberosPorServicio.some((consulta) => consulta.isFetching)}
          onRetryConsultasBarberos={() => {
            void Promise.all(
              consultasBarberosPorServicio.map((consulta) => consulta.refetch()),
            );
          }}
          error={error}
          onRetryServicios={() => void refetch()}
          serviciosActivos={serviciosActivos}
          servicioId={servicioId}
          onSelectServicio={cambiarServicio}
          formatearPrecio={formatearPrecio}
        />
      )}

      {paso === 2 && (
        <StepBarberos
          isLoading={isLoading}
          servicioSeleccionado={servicioSeleccionado}
          reservaId={reservaId}
          irAPaso={irAPaso}
          consultaBarberosServicio={consultaBarberosServicio}
          barberosDelServicio={barberosDelServicio}
          barberoId={barberoId}
          onSelectBarbero={seleccionarBarbero}
        />
      )}

      {paso === 3 && (
        <StepAgenda
          isLoading={isLoading}
          consultaBarberosServicio={consultaBarberosServicio}
          servicioSeleccionado={servicioSeleccionado}
          barberoSeleccionado={barberoSeleccionado}
          barberoFijoId={barberoFijoId}
          setBarberoFijoId={setBarberoFijoId}
          irAPaso={irAPaso}
          paginaFechas={paginaFechas}
          setPaginaFechas={setPaginaFechas}
          totalPaginasFechas={totalPaginasFechas}
          fechasDeLaPagina={fechasDeLaPagina}
          consultasDisponibilidadFechas={consultasDisponibilidadFechas}
          formatearDiaCalendario={formatearDiaCalendario}
          fechaSeleccionada={fechaSeleccionada}
          setFechaSeleccionada={setFechaSeleccionada}
          horaSeleccionada={horaSeleccionada}
          setHoraSeleccionada={setHoraSeleccionada}
          erroresDisponibilidadFechas={erroresDisponibilidadFechas}
          paginaSinDisponibilidad={paginaSinDisponibilidad}
          disponibilidad={disponibilidad}
          horariosDisponibles={horariosDisponibles}
          formatearFecha={formatearFecha}
          jornadaSeleccionada={jornadaSeleccionada}
          setJornadaSeleccionada={setJornadaSeleccionada}
          horariosManana={horariosManana}
          horariosTarde={horariosTarde}
          horariosNoche={horariosNoche}
        />
      )}

      {paso === 4 && (
        <StepConfirmacion
          isLoading={isLoading}
          consultaBarberosServicio={consultaBarberosServicio}
          servicioSeleccionado={servicioSeleccionado}
          barberoSeleccionado={barberoSeleccionado}
          reservaCreada={reservaCreada}
          reservaModificada={reservaModificada}
          irAPaso={irAPaso}
          errorConfirmacion={errorConfirmacion}
          conflictoReserva={conflictoReserva}
          mensajeErrorConfirmacion={mensajeErrorConfirmacion}
          volverASeleccionHorario={volverASeleccionHorario}
          effectiveName={effectiveName}
          reservaId={reservaId}
          copiarCodigoCita={copiarCodigoCita}
          codigoCopiado={codigoCopiado}
          fechaSeleccionada={fechaSeleccionada}
          horaSeleccionada={horaSeleccionada}
          formatearFecha={formatearFecha}
          formatearPrecio={formatearPrecio}
          clienteSesion={clienteSesion}
          nombreInvitado={nombreInvitado}
          setNombreInvitado={setNombreInvitado}
          apellidoInvitado={apellidoInvitado}
          setApellidoInvitado={setApellidoInvitado}
          telefonoInvitado={telefonoInvitado}
          setTelefonoInvitado={setTelefonoInvitado}
          slugActivo={slugActivo}
          limpiarBorradorYReiniciar={() => {
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
          cambiarReservaDeInvitado={cambiarReservaDeInvitado}
          cambiarBarberoDeInvitado={cambiarBarberoDeInvitado}
          cancelarMiReserva={cancelarMiReserva}
          cancelarReservaDeClienteAutenticado={cancelarReservaDeClienteAutenticado}
          cancelarInvitado={cancelarInvitado}
          cancelarReservaDeInvitado={cancelarReservaDeInvitado}
          enviarReserva={enviarReserva}
          errorContacto={errorContacto}
          crearReserva={crearReserva}
          modificarReserva={modificarReserva}
          modificarInvitado={modificarInvitado}
        />
      )}

      {/* Barra flotante inferior de acción continua */}
      <BookingFloatingBar
        paso={paso}
        servicioSeleccionado={servicioSeleccionado}
        barberoSeleccionado={barberoSeleccionado}
        fechaSeleccionada={fechaSeleccionada}
        horaSeleccionada={horaSeleccionada}
        barberoFijoId={barberoFijoId}
        reservaCreada={Boolean(reservaCreada)}
        reservaModificada={Boolean(reservaModificada)}
        formatearPrecio={formatearPrecio}
        formatearFecha={formatearFecha}
        continuarDesdeServicio={continuarDesdeServicio}
        continuarDesdeBarbero={continuarDesdeBarbero}
        irAPaso={irAPaso}
      />

      {/* Espaciador inferior para que la barra flotante nunca cubra la parte inferior de la vista */}
      <div className="booking-flow__bottom-spacer" aria-hidden="true" />
    </main>
  );
};

export default ReservaClientePage;

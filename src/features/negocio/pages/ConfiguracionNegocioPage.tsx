import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Image as ImageIcon,
  Palette,
  Upload,
  Trash2,
  Check,
  ExternalLink,
  Save,
  AlertCircle,
  Globe,
  Loader2,
  Crosshair,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { perfilNegocioApi } from '../services/perfilNegocioApi';
import type {
  PerfilNegocioGestionResponse,
  ActualizarPerfilNegocioDto,
  TipoRecursoPerfil,
} from '../types/perfilNegocio.types';
import {
  TEMAS_TENANT,
  type TenantThemeId,
  resolverTemaTenant,
  guardarTemaTenant,
} from '../../../config/tenantTheme';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import { Share2 } from 'lucide-react';
import { RedesSocialesSection } from '../components/RedesSocialesSection';

function parsearCoordenada(latStr: string, lngStr: string): { lat: number; lng: number } | null {
  const lat = Number.parseFloat(latStr);
  const lng = Number.parseFloat(lngStr);
  if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  return null;
}

function extraerCoordenadas(texto: string): { lat: number; lng: number } | null {
  if (!texto) return null;
  const limpio = texto.trim();

  // 1. Patrón en URLs de Google Maps con @lat,lng
  const matchAt = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(limpio);
  if (matchAt) {
    const coord = parsearCoordenada(matchAt[1], matchAt[2]);
    if (coord) return coord;
  }

  // 2. Patrón en parámetros de consulta (?q=lat,lng o ?query=lat,lng o ?ll=lat,lng)
  const matchQuery = /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(limpio);
  if (matchQuery) {
    const coord = parsearCoordenada(matchQuery[1], matchQuery[2]);
    if (coord) return coord;
  }

  // 3. Patrón simple: dos números decimales separados por coma, espacio o punto y coma
  const matchSimple = /^(-?\d+(?:\.\d+)?)[,\s;]+(-?\d+(?:\.\d+)?)$/.exec(limpio);
  if (matchSimple) {
    const coord = parsearCoordenada(matchSimple[1], matchSimple[2]);
    if (coord) return coord;
  }

  // 4. Buscar dos números decimales consecutivos en cualquier parte del texto
  const matchAny = /(-?\d+\.\d+)[,\s;]+(-?\d+\.\d+)/.exec(limpio);
  if (matchAny) {
    const coord = parsearCoordenada(matchAny[1], matchAny[2]);
    if (coord) return coord;
  }

  return null;
}

function validarCoordenadasFormulario(
  latitud: string,
  longitud: string
): { valid: boolean; error?: string; latNum?: number; lngNum?: number } {
  const tieneLat = latitud.trim().length > 0;
  const tieneLng = longitud.trim().length > 0;

  if ((tieneLat && !tieneLng) || (!tieneLat && tieneLng)) {
    return { valid: false, error: 'La latitud y la longitud deben ingresarse juntas.' };
  }

  if (!tieneLat && !tieneLng) {
    return { valid: true };
  }

  const latNum = Number.parseFloat(latitud);
  const lngNum = Number.parseFloat(longitud);
  if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
    return { valid: false, error: 'La latitud debe ser un número válido entre -90 y 90.' };
  }
  if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return { valid: false, error: 'La longitud debe ser un número válido entre -180 y 180.' };
  }

  return { valid: true, latNum, lngNum };
}

function extraerMensajeApiError(err: any, fallback: string): string {
  const msg = err.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
}

function validarArchivoRecurso(tipo: TipoRecursoPerfil, file: File): string | null {
  if (tipo === 'banner') {
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      return 'El banner principal debe ser un archivo PNG.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'El banner no debe superar los 5 MB.';
    }
  } else {
    if (!file.type.includes('svg') && !file.name.toLowerCase().endsWith('.svg')) {
      return 'Los logos e isotipos oficiales deben estar en formato vectorial SVG.';
    }
    if (file.size > 500 * 1024) {
      return 'El archivo SVG no debe superar 500 KB.';
    }
  }
  return null;
}

export default function ConfiguracionNegocioPage() {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slugActivo = paramSlug || obtenerNegocioSlugActivo() || 'kyrios-studio';
  const { showToast } = useToastContext();
  const confirm = useConfirm();

  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [perfil, setPerfil] = useState<PerfilNegocioGestionResponse | null>(null);

  // Estados del formulario de datos generales y ubicación
  const [frasePrincipal, setFrasePrincipal] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [departamento, setDepartamento] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [pegarMapsTexto, setPegarMapsTexto] = useState<string>('');
  const [obteniendoGps, setObteniendoGps] = useState<boolean>(false);
  const [mostrarAjusteManual, setMostrarAjusteManual] = useState<boolean>(false);

  // Estado para la subida de recursos individuales
  const [subiendoRecurso, setSubiendoRecurso] = useState<TipoRecursoPerfil | null>(null);
  const [eliminandoRecurso, setEliminandoRecurso] = useState<TipoRecursoPerfil | null>(null);

  // Estado del tema visual
  const [temaActual, setTemaActual] = useState<TenantThemeId>(() => resolverTemaTenant(slugActivo));
  type TabConfiguracion = 'general' | 'marca' | 'redes';
  const [tabActiva, setTabActiva] = useState<TabConfiguracion>('general');

  // Refs de inputs de tipo file
  const inputBannerRef = useRef<HTMLInputElement>(null);
  const inputLogoBlancoRef = useRef<HTMLInputElement>(null);
  const inputLogoNegroRef = useRef<HTMLInputElement>(null);
  const inputFaviconRef = useRef<HTMLInputElement>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await perfilNegocioApi.obtenerPerfilGestion();
      setPerfil(data);

      setFrasePrincipal(data.contenido?.frasePrincipal || '');
      setDireccion(data.ubicacion?.direccion || '');
      setCiudad(data.ubicacion?.ciudad || '');
      setDepartamento(data.ubicacion?.departamento || '');
      setReferencia(data.ubicacion?.referencia || '');
      setLatitud(data.ubicacion?.latitud != null ? String(data.ubicacion.latitud) : '');
      setLongitud(data.ubicacion?.longitud != null ? String(data.ubicacion.longitud) : '');
      if (data.ubicacion?.latitud != null && data.ubicacion?.longitud != null) {
        setPegarMapsTexto(`${data.ubicacion.latitud}, ${data.ubicacion.longitud}`);
      }
      if (data.contenido?.temaKey && (TEMAS_TENANT as any)[data.contenido.temaKey]) {
        setTemaActual(data.contenido.temaKey as TenantThemeId);
      }
    } catch (err: any) {
      console.error('Error al cargar perfil del negocio:', err);
      showToast('danger', 'No fue posible cargar la información de la barbería.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
    setTemaActual(resolverTemaTenant(slugActivo));
  }, [slugActivo]);

  // Guardar datos comerciales y ubicación
  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();

    const validacion = validarCoordenadasFormulario(latitud, longitud);
    if (!validacion.valid) {
      showToast('danger', validacion.error!);
      return;
    }

    const payload: ActualizarPerfilNegocioDto = {
      frasePrincipal: frasePrincipal.trim() || undefined,
      temaKey: temaActual,
      direccion: direccion.trim() || undefined,
      ciudad: ciudad.trim() || undefined,
      departamento: departamento.trim() || undefined,
      referencia: referencia.trim() || undefined,
      latitud: validacion.latNum,
      longitud: validacion.lngNum,
    };

    try {
      setGuardando(true);
      const actualizado = await perfilNegocioApi.actualizarPerfil(payload);
      setPerfil(actualizado);
      showToast('success', '¡Información comercial y ubicación actualizadas exitosamente!');
    } catch (err: any) {
      console.error('Error al actualizar perfil de negocio:', err);
      showToast('danger', extraerMensajeApiError(err, 'Error al guardar los datos.'));
    } finally {
      setGuardando(false);
    }
  };

  // Obtener ubicación GPS actual mediante el navegador
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      showToast('danger', 'Tu navegador no tiene soporte para geolocalización.');
      return;
    }

    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitud(String(lat));
        setLongitud(String(lng));
        setPegarMapsTexto(`${lat}, ${lng}`);
        setObteniendoGps(false);
        showToast('success', `¡Ubicación GPS detectada!: ${lat}, ${lng}`);
      },
      (err) => {
        setObteniendoGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast('warning', 'Permiso de ubicación denegado en el navegador.');
        } else {
          showToast('danger', 'No fue posible detectar la ubicación GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Extraer coordenadas automáticamente al pegar enlace o texto de Maps
  const handlePegarMaps = (texto: string) => {
    setPegarMapsTexto(texto);
    if (!texto.trim()) return;

    const coords = extraerCoordenadas(texto);
    if (coords) {
      setLatitud(coords.lat.toFixed(6));
      setLongitud(coords.lng.toFixed(6));
      showToast('success', `Coordenadas extraídas: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    } else if (texto.includes('maps.app.goo.gl')) {
      showToast(
        'warning',
        'Los enlaces acortados maps.app.goo.gl no tienen números directos. Ábrelo en tu navegador y copia la URL completa de la barra de direcciones o haz clic derecho en el mapa.',
      );
    }
  };

  // Subir un archivo de marca
  const handleSubirArchivo = async (tipo: TipoRecursoPerfil, file: File) => {
    const errorArchivo = validarArchivoRecurso(tipo, file);
    if (errorArchivo) {
      showToast('danger', errorArchivo);
      return;
    }

    try {
      setSubiendoRecurso(tipo);
      const res = await perfilNegocioApi.subirRecurso(tipo, file);
      setPerfil(res);
      window.dispatchEvent(new Event('tenant-perfil-actualizado'));
      showToast('success', `¡Recurso de marca (${tipo}) actualizado correctamente!`);
    } catch (err: any) {
      console.error(`Error al subir ${tipo}:`, err);
      showToast('danger', extraerMensajeApiError(err, `No fue posible subir el recurso ${tipo}.`));
    } finally {
      setSubiendoRecurso(null);
    }
  };

  // Eliminar un recurso de marca
  const handleEliminarRecurso = async (tipo: TipoRecursoPerfil) => {
    const etiquetas: Record<TipoRecursoPerfil, string> = {
      banner: "el Banner Principal",
      "logo-blanco": "el Logo Modo Oscuro (Blanco)",
      "logo-negro": "el Logo Modo Claro (Negro)",
      favicon: "el Favicon del Sitio",
    };
    const etiqueta = etiquetas[tipo] || tipo;

    const aceptado = await confirm({
      title: "Eliminar Recurso de Marca",
      message: `¿Estás seguro de que deseas eliminar ${etiqueta} de esta barbería? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar recurso",
      cancelLabel: "Cancelar",
      variant: "danger",
    });

    if (!aceptado) {
      return;
    }

    try {
      setEliminandoRecurso(tipo);
      const res = await perfilNegocioApi.eliminarRecurso(tipo);
      setPerfil(res);
      window.dispatchEvent(new Event('tenant-perfil-actualizado'));
      showToast('success', `Recurso (${tipo}) eliminado.`);
    } catch (err: any) {
      console.error(`Error al eliminar ${tipo}:`, err);
      showToast('danger', `No fue posible eliminar el recurso.`);
    } finally {
      setEliminandoRecurso(null);
    }
  };

  // Cambiar tema visual de la sede
  const handleSeleccionarTema = async (temaId: TenantThemeId) => {
    guardarTemaTenant(slugActivo, temaId);
    setTemaActual(temaId);

    // Validar coordenadas actuales si existen
    const validacion = validarCoordenadasFormulario(latitud, longitud);

    // Construir payload completo preservando toda la información comercial y ubicación existente
    // para evitar que el PUT del backend sobreescriba con null los campos omitidos.
    const payload: ActualizarPerfilNegocioDto = {
      temaKey: temaId,
      frasePrincipal: frasePrincipal.trim() || perfil?.contenido?.frasePrincipal || undefined,
      direccion: direccion.trim() || perfil?.ubicacion?.direccion || undefined,
      ciudad: ciudad.trim() || perfil?.ubicacion?.ciudad || undefined,
      departamento: departamento.trim() || perfil?.ubicacion?.departamento || undefined,
      referencia: referencia.trim() || perfil?.ubicacion?.referencia || undefined,
      latitud:
        validacion.valid && validacion.latNum !== undefined
          ? validacion.latNum
          : perfil?.ubicacion?.latitud != null
            ? Number(perfil.ubicacion.latitud)
            : undefined,
      longitud:
        validacion.valid && validacion.lngNum !== undefined
          ? validacion.lngNum
          : perfil?.ubicacion?.longitud != null
            ? Number(perfil.ubicacion.longitud)
            : undefined,
    };

    try {
      const actualizado = await perfilNegocioApi.actualizarPerfil(payload);
      setPerfil(actualizado);
      window.dispatchEvent(new CustomEvent('tenant-perfil-actualizado'));
      showToast('success', `Tema guardado en la sede: ${TEMAS_TENANT[temaId]?.nombre}`);
    } catch (err: any) {
      console.error('Error al guardar tema en backend:', err);
      showToast('warning', `Tema aplicado localmente. Aviso del servidor: ${extraerMensajeApiError(err, 'No fue posible persistir en la base de datos')}`);
    }
  };

  // Resuelve la URL pública para mostrar la imagen subida
  const resolverUrlRecurso = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (cargando) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <KyriosSpinner />
        <span className="mt-3 text-muted">Cargando configuración de la barbería...</span>
      </div>
    );
  }

  const negocioNombre = perfil?.negocio?.nombre || slugActivo.toUpperCase();

  return (
    <div className="container-fluid px-2 px-md-4 py-4" style={{ maxWidth: '1280px' }}>
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
              <Building2 size={24} />
            </div>
            <h1 className="h3 fw-bold mb-0">Configuración de la Barbería</h1>
          </div>
          <p className="text-muted small mb-0">
            Gestiona la identidad visual, datos comerciales y ubicación de la sede <strong className="text-primary">{negocioNombre}</strong> ({slugActivo}).
          </p>
        </div>

        {/* Badge de estado */}
        <div className="d-flex align-items-center gap-2">
          {perfil?.configurado ? (
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill d-flex align-items-center gap-1">
              <Check size={14} /> Perfil Configurado
            </span>
          ) : (
            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-2 rounded-pill d-flex align-items-center gap-1">
              <AlertCircle size={14} /> Perfil Pendiente de Configurar
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de Configuración SaaS */}
      <div className="d-flex flex-wrap gap-2 mb-4 border-bottom pb-2">
        <button
          type="button"
          onClick={() => setTabActiva('general')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold transition-all ${
            tabActiva === 'general'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light border text-body-secondary bg-body-tertiary'
          }`}
        >
          <MapPin size={16} /> Información Comercial y Ubicación
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('marca')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold transition-all ${
            tabActiva === 'marca'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light border text-body-secondary bg-body-tertiary'
          }`}
        >
          <Palette size={16} /> Diseño y Recursos de Marca
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('redes')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold transition-all ${
            tabActiva === 'redes'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light border text-body-secondary bg-body-tertiary'
          }`}
        >
          <Share2 size={16} /> Redes Sociales Oficiales
        </button>
      </div>

      {/* Pestaña 1: Información Comercial y Ubicación */}
      {tabActiva === 'general' && (
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card shadow-sm border-0 card-surface h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <div className="d-flex align-items-center gap-2">
                <MapPin className="text-primary" size={20} />
                <h5 className="fw-bold mb-0">Información Comercial y Ubicación</h5>
              </div>
              <p className="text-muted small mt-1 mb-0">
                Estos datos son visibles para los clientes en el portal web y en la confirmación de citas.
              </p>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleGuardarDatos}>
                {/* Lema o Frase Principal */}
                <div className="mb-3">
                  <label htmlFor="input-frase-principal" className="form-label fw-semibold small">
                    Frase Principal / Lema de la Barbería
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="input-frase-principal"
                    placeholder="Ej. Barbería de alto estándar · Popayán"
                    maxLength={255}
                    value={frasePrincipal}
                    onChange={(e) => setFrasePrincipal(e.target.value)}
                  />
                  <div className="form-text small">
                    Aparece como subtítulo destacado en la portada principal.
                  </div>
                </div>

                {/* Dirección y Referencia */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-8">
                    <label htmlFor="input-direccion" className="form-label fw-semibold small">Dirección Oficial</label>
                    <input
                      type="text"
                      className="form-control"
                      id="input-direccion"
                      placeholder="Ej. Cra 9 # 18N - 45, Local 2"
                      maxLength={255}
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label htmlFor="input-ciudad" className="form-label fw-semibold small">Ciudad</label>
                    <input
                      type="text"
                      className="form-control"
                      id="input-ciudad"
                      placeholder="Ej. Popayán"
                      maxLength={100}
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="input-departamento" className="form-label fw-semibold small">Departamento / Provincia</label>
                    <input
                      type="text"
                      className="form-control"
                      id="input-departamento"
                      placeholder="Ej. Cauca"
                      maxLength={100}
                      value={departamento}
                      onChange={(e) => setDepartamento(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="input-referencia" className="form-label fw-semibold small">Referencia de Llegada</label>
                    <input
                      type="text"
                      className="form-control"
                      id="input-referencia"
                      placeholder="Ej. Frente al Centro Comercial"
                      maxLength={255}
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                    />
                  </div>
                </div>

                {/* Coordenadas Geográficas (Google Maps y Waze) */}
                <div className="p-3 p-md-4 rounded-3 bg-body-tertiary border mb-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <span className="fw-semibold small d-flex align-items-center gap-1.5">
                      <Globe size={16} className="text-primary" /> Ubicación en Google Maps y Waze
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      {latitud && longitud && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2.5"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <ExternalLink size={13} /> Probar punto en Maps
                        </a>
                      )}
                      {(latitud || longitud) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1 px-2"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => {
                            setLatitud('');
                            setLongitud('');
                            setPegarMapsTexto('');
                          }}
                          title="Limpiar ubicación"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-muted small mb-3">
                    Configura la ubicación exacta para que tus clientes puedan abrir la ruta directa en Google Maps y Waze desde la web.
                  </p>

                  {/* Asistente interactivo: Pegar enlace o usar GPS */}
                  <div className="row g-2 align-items-center mb-3">
                    <div className="col-12 col-md-8">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-body border-end-0">
                          <Navigation size={14} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Pegar enlace de Google Maps o coordenadas (ej: 2.4419, -76.6063)"
                          value={pegarMapsTexto}
                          onChange={(e) => handlePegarMaps(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-1.5 py-1.5"
                        onClick={obtenerUbicacionActual}
                        disabled={obteniendoGps}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {obteniendoGps ? (
                          <>
                            <Loader2 size={13} className="spinner-border spinner-border-sm" /> Detectando GPS...
                          </>
                        ) : (
                          <>
                            <Crosshair size={14} className="text-primary" /> Usar mi ubicación actual
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Resumen visual de ubicación configurada */}
                  {latitud && longitud ? (
                    <div className="alert alert-success d-flex align-items-center justify-content-between p-2 mb-2 small" style={{ fontSize: '0.8rem' }}>
                      <div className="d-flex align-items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                        <span>
                          Punto configurado: <strong>{latitud}, {longitud}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setMostrarAjusteManual(!mostrarAjusteManual)}
                      >
                        {mostrarAjusteManual ? 'Ocultar ajuste manual' : 'Ver / Ajustar latitud y longitud'}
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                      <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                        💡 Tip: En Google Maps en tu PC, haz clic derecho sobre el local y copia las coordenadas.
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setMostrarAjusteManual(!mostrarAjusteManual)}
                      >
                        {mostrarAjusteManual ? 'Ocultar campos' : 'Ingresar latitud y longitud a mano'}
                      </button>
                    </div>
                  )}

                  {/* Campos técnicos colapsables para ajuste manual */}
                  {mostrarAjusteManual && (
                    <div className="p-3 rounded bg-body border mt-2">
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label htmlFor="input-latitud-decimal" className="form-label small text-muted mb-1" style={{ fontSize: '0.76rem' }}>Latitud decimal</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control form-control-sm"
                            id="input-latitud-decimal"
                            placeholder="Ej. 2.483989"
                            value={latitud}
                            onChange={(e) => setLatitud(e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label htmlFor="input-longitud-decimal" className="form-label small text-muted mb-1" style={{ fontSize: '0.76rem' }}>Longitud decimal</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control form-control-sm"
                            id="input-longitud-decimal"
                            placeholder="Ej. -76.580762"
                            value={longitud}
                            onChange={(e) => setLongitud(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de guardado */}
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2"
                    disabled={guardando}
                  >
                    {guardando ? (
                      <>
                        <Loader2 size={16} className="spinner-border spinner-border-sm" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Guardar Información Comercial
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Pestaña 2: Diseño y Recursos de Marca */}
      {tabActiva === 'marca' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-4">
            <div className="col-12 col-xl-12">
              <div className="card shadow-sm border-0 card-surface mb-4">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Palette className="text-primary" size={20} />
                <h5 className="fw-bold mb-0">Paleta y Tema Visual</h5>
              </div>
              <p className="text-muted small mt-1 mb-0">
                Selecciona la personalidad visual de tu barbería. Se adapta tanto al modo claro como al modo oscuro.
              </p>
            </div>

            <div className="card-body p-4">
              <div className="d-flex flex-column gap-2">
                {(Object.keys(TEMAS_TENANT) as TenantThemeId[]).map((tId) => {
                  const cfg = TEMAS_TENANT[tId];
                  const esActivo = temaActual === tId;

                  return (
                    <button
                      key={tId}
                      type="button"
                      onClick={() => handleSeleccionarTema(tId)}
                      className={`btn text-start p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                        esActivo
                          ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                          : 'border-secondary border-opacity-25 bg-body-tertiary hover-surface'
                      }`}
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span
                          className="rounded-circle shadow-sm d-inline-block"
                          style={{
                            width: 24,
                            height: 24,
                            backgroundColor: cfg.colorPrimario,
                            border: '2px solid rgba(255,255,255,0.7)',
                          }}
                        />
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold small">{cfg.nombre}</span>
                            <span className="badge bg-secondary bg-opacity-25 text-body" style={{ fontSize: '0.7rem' }}>
                              {cfg.badge}
                            </span>
                          </div>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            {cfg.descripcion}
                          </span>
                        </div>
                      </div>

                      {esActivo && (
                        <div className="text-primary">
                          <Check size={20} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
            </div>
          </div>

          <div>
            <div className="card shadow-sm border-0 card-surface">
          <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
            <div className="d-flex align-items-center gap-2">
              <ImageIcon className="text-primary" size={20} />
              <h5 className="fw-bold mb-0">Identidad Visual y Archivos de Marca</h5>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Sube tus archivos oficiales. El sistema los valida, sanea y almacena de forma aislada para tu barbería.
            </p>
          </div>

          <div className="card-body p-4">
            <div className="row g-4">
              {/* 1. Banner Principal (PNG) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Banner Principal</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary">PNG (Máx 5MB)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Portada panorámica para la cabecera de la página de reservas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center overflow-hidden mb-3 bg-surface-app"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.bannerUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.bannerUrl)!}
                          alt="Banner de la barbería"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin banner personalizado</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputBannerRef}
                      accept="image/png"
                      className="d-none"
                      onChange={(e) => {
                        if (e.target.files?.[0]) void handleSubirArchivo('banner', e.target.files[0]);
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'banner'}
                        onClick={() => inputBannerRef.current?.click()}
                      >
                        {subiendoRecurso === 'banner' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir PNG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.bannerUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar banner"
                          disabled={eliminandoRecurso === 'banner'}
                          onClick={() => handleEliminarRecurso('banner')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Logo para Fondos Oscuros (SVG Blanco) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Logo Modo Oscuro</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Blanco)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Se muestra sobre fondos oscuros o barras de navegación nocturnas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3"
                      style={{ height: '140px', backgroundColor: '#18181b', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.logoBlancoUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.logoBlancoUrl)!}
                          alt="Logo para fondo oscuro"
                          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-white-50 p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin logo blanco</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputLogoBlancoRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        if (e.target.files?.[0]) void handleSubirArchivo('logo-blanco', e.target.files[0]);
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'logo-blanco'}
                        onClick={() => inputLogoBlancoRef.current?.click()}
                      >
                        {subiendoRecurso === 'logo-blanco' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.logoBlancoUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar logo blanco"
                          disabled={eliminandoRecurso === 'logo-blanco'}
                          onClick={() => handleEliminarRecurso('logo-blanco')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Logo para Fondos Claros (SVG Negro) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Logo Modo Claro</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Negro)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Se muestra sobre fondos claros, tickets y cabeceras blancas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3 bg-white"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.logoNegroUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.logoNegroUrl)!}
                          alt="Logo para fondo claro"
                          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin logo negro</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputLogoNegroRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        if (e.target.files?.[0]) void handleSubirArchivo('logo-negro', e.target.files[0]);
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'logo-negro'}
                        onClick={() => inputLogoNegroRef.current?.click()}
                      >
                        {subiendoRecurso === 'logo-negro' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.logoNegroUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar logo negro"
                          disabled={eliminandoRecurso === 'logo-negro'}
                          onClick={() => handleEliminarRecurso('logo-negro')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Favicon (SVG) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Favicon del Sitio</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Icono)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Icono visual que identifica la pestaña del navegador de los clientes.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3 bg-surface-app"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.faviconUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.faviconUrl)!}
                          alt="Favicon de la barbería"
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin favicon personalizado</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputFaviconRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        if (e.target.files?.[0]) void handleSubirArchivo('favicon', e.target.files[0]);
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'favicon'}
                        onClick={() => inputFaviconRef.current?.click()}
                      >
                        {subiendoRecurso === 'favicon' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.faviconUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar favicon"
                          disabled={eliminandoRecurso === 'favicon'}
                          onClick={() => handleEliminarRecurso('favicon')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    )}

      {/* Pestaña 3: Redes Sociales Oficiales */}
      {tabActiva === 'redes' && (
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <RedesSocialesSection slugNegocio={slugActivo} />
          </div>
        </div>
      )}
    </div>
  );
}
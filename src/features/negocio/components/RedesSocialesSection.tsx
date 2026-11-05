import React, { useState, useEffect } from 'react';
import {
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  Link as LinkIcon,
  Check,
  Clipboard,
  ShieldCheck,
  Minus,
  Sparkles,
} from 'lucide-react';
import { redesSocialesApi } from '../services/redesSocialesApi';
import type {
  RedSocial,
  TipoRedSocial,
  CrearRedSocialDto,
} from '../types/redesSociales.types';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/molecules/ConfirmDialog';
import { useToastContext } from '../../../shared/ui/ToastContext';
import './RedesSocialesSection.css';

interface RedesSocialesSectionProps {
  slugNegocio: string;
}

interface RedConfigItem {
  label: string;
  placeholder: string;
  baseDomain: string;
  color: string;
  bg: string;
  descripcion: string;
}

/* =========================================================================
   Iconos auténticos de cada plataforma (SVG de alta fidelidad)
   ========================================================================= */

const InstagramBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsAppBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const TikTokBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.92a8.28 8.28 0 0 0 4.82 1.52V7c-.37 0-.73-.11-1.05-.31z" />
  </svg>
);

const FacebookBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const OtherBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const REDES_CONFIG: Record<TipoRedSocial, RedConfigItem> = {
  INSTAGRAM: {
    label: 'Instagram',
    placeholder: 'https://instagram.com/tu_barberia',
    baseDomain: 'instagram.com',
    color: '#E1306C',
    bg: 'rgba(225, 48, 108, 0.14)',
    descripcion: 'Fotos, reels y catálogo visual de cortes',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    placeholder: 'https://wa.me/573001234567',
    baseDomain: 'wa.me',
    color: '#25D366',
    bg: 'rgba(37, 211, 102, 0.14)',
    descripcion: 'Atención al cliente y agendamiento directo',
  },
  TIKTOK: {
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@tu_barberia',
    baseDomain: 'tiktok.com',
    color: '#00f2fe',
    bg: 'rgba(0, 242, 254, 0.14)',
    descripcion: 'Videos dinámicos y tendencias de estilo',
  },
  FACEBOOK: {
    label: 'Facebook',
    placeholder: 'https://facebook.com/tu_barberia',
    baseDomain: 'facebook.com',
    color: '#1877F2',
    bg: 'rgba(24, 119, 242, 0.14)',
    descripcion: 'Página oficial de la comunidad y novedades',
  },
  OTRO: {
    label: 'Otro Enlace',
    placeholder: 'https://tusitio.com',
    baseDomain: '',
    color: '#c29752',
    bg: 'rgba(194, 151, 82, 0.14)',
    descripcion: 'YouTube, Twitter / X, Blog o sitio web oficial',
  },
};

export const RedesSocialesSection: React.FC<RedesSocialesSectionProps> = ({ slugNegocio }) => {
  const { showToast } = useToastContext();
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modal Agregar / Editar
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [redEditando, setRedEditando] = useState<RedSocial | null>(null);

  // Modal Confirmar Retiro / Desactivación
  const [redAEliminar, setRedAEliminar] = useState<RedSocial | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Form State
  const [tipo, setTipo] = useState<TipoRedSocial>('INSTAGRAM');
  const [nombre, setNombre] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [orden, setOrden] = useState<number>(0);
  const [errorUrl, setErrorUrl] = useState<string>('');
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null);

  const cargarRedes = async () => {
    try {
      setCargando(true);
      // Listar todas las redes (activas e inactivas) para el panel de administración
      const data = await redesSocialesApi.listar(true);
      setRedes(data);
    } catch (err: any) {
      console.error('Error cargando redes sociales:', err);
      showToast('danger', 'No se pudieron cargar las redes sociales del negocio.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarRedes();
  }, [slugNegocio]);

  const abrirModalCrear = () => {
    setRedEditando(null);
    const tiposYaConectados = new Set(redes.filter((r) => r.tipo !== 'OTRO').map((r) => r.tipo));
    const tiposDisponibles = (Object.keys(REDES_CONFIG) as TipoRedSocial[]).filter(
      (t) => t === 'OTRO' || !tiposYaConectados.has(t)
    );
    const tipoInicial = tiposDisponibles[0] || 'OTRO';
    setTipo(tipoInicial);
    setNombre(tipoInicial === 'OTRO' ? '' : REDES_CONFIG[tipoInicial].label);
    setUrl('');
    setOrden(redes.length + 1);
    setErrorUrl('');
    setModalOpen(true);
  };

  const abrirModalEditar = (red: RedSocial) => {
    setRedEditando(red);
    setTipo(red.tipo);
    setNombre(red.nombre);
    setUrl(red.url);
    setOrden(red.orden);
    setErrorUrl('');
    setModalOpen(true);
  };

  const handleTipoChange = (nuevoTipo: TipoRedSocial) => {
    // Si la plataforma predefinida ya está conectada, avisar y no seleccionarla
    if (!redEditando && nuevoTipo !== 'OTRO' && redes.some((r) => r.tipo === nuevoTipo)) {
      showToast('info', `${REDES_CONFIG[nuevoTipo].label} ya está en tu lista. Puedes editar su enlace directamente.`);
      return;
    }

    setTipo(nuevoTipo);
    if (nuevoTipo !== 'OTRO') {
      setNombre(REDES_CONFIG[nuevoTipo].label);
    } else {
      setNombre('');
    }
    if (url.startsWith('https://')) {
      const prevDomain = REDES_CONFIG[tipo]?.baseDomain;
      if (prevDomain && url.includes(prevDomain)) {
        setUrl('');
      }
    }
  };

  const validarUrl = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setErrorUrl('La URL es requerida.');
      return false;
    }
    if (!trimmed.startsWith('https://')) {
      setErrorUrl('Por seguridad, la URL debe comenzar estrictamente con https://');
      return false;
    }
    try {
      new URL(trimmed);
      setErrorUrl('');
      return true;
    } catch {
      setErrorUrl('Introduce una dirección URL válida.');
      return false;
    }
  };

  const handlePegarPortapapeles = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        let clean = text.trim();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = `https://${clean}`;
        } else if (clean.startsWith('http://')) {
          clean = clean.replace('http://', 'https://');
        }
        setUrl(clean);
        validarUrl(clean);
      }
    } catch {
      showToast('info', 'Usa Ctrl+V / Cmd+V para pegar tu enlace en el campo.');
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarUrl(url)) return;

    setGuardando(true);
    try {
      if (redEditando) {
        await redesSocialesApi.actualizar(redEditando.id, {
          url: url.trim(),
          orden: Number(orden) || 0,
          ...(redEditando.tipo === 'OTRO' ? { nombre: nombre.trim() } : {}),
        });
        showToast('success', `Red social ${redEditando.nombre} actualizada correctamente.`);
      } else {
        const nuevasRedes: CrearRedSocialDto[] = [
          ...redes.map((r) => ({
            tipo: r.tipo,
            nombre: r.nombre,
            url: r.url,
            orden: r.orden,
          })),
          {
            tipo,
            nombre: tipo === 'OTRO' ? nombre.trim() : REDES_CONFIG[tipo].label,
            url: url.trim(),
            orden: Number(orden) || 0,
          },
        ];

        await redesSocialesApi.reemplazar(nuevasRedes);
        showToast('success', '¡Red social oficial conectada con éxito!');
      }

      setModalOpen(false);
      window.dispatchEvent(new Event('tenant-perfil-actualizado'));
      await cargarRedes();
    } catch (err: any) {
      console.error('Error guardando red social:', err);
      const msg = err.response?.data?.message || 'Error al guardar la red social.';
      showToast('danger', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleVisibilidad = async (red: RedSocial) => {
    try {
      setCambiandoEstadoId(red.id);
      if (red.activo) {
        // Pausar / Ocultar de la web
        await redesSocialesApi.desactivar(red.id);
        showToast('info', `${red.nombre} ha sido ocultada del catálogo público.`);
      } else {
        // Reactivar
        await redesSocialesApi.activar(red.id);
        showToast('success', `${red.nombre} ahora es visible para los clientes.`);
      }
      window.dispatchEvent(new Event('tenant-perfil-actualizado'));
      await cargarRedes();
    } catch (err: any) {
      console.error('Error al cambiar visibilidad de red social:', err);
      const msg = err.response?.data?.message || 'Error al cambiar la visibilidad.';
      showToast('danger', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  const handleSolicitarEliminar = (red: RedSocial) => {
    setRedAEliminar(red);
  };

  const confirmarEliminarRed = async () => {
    if (!redAEliminar) return;

    setEliminando(true);
    try {
      // Eliminación definitiva
      await redesSocialesApi.eliminarDefinitivo(redAEliminar.id);
      showToast('success', `${redAEliminar.nombre} fue eliminada definitivamente.`);
      window.dispatchEvent(new Event('tenant-perfil-actualizado'));
      setRedAEliminar(null);
      await cargarRedes();
    } catch (err: any) {
      console.error('Error eliminando red social:', err);
      showToast('danger', 'Error al eliminar la red social.');
    } finally {
      setEliminando(false);
    }
  };

  const renderIcono = (tipoRed: TipoRedSocial, size = 20) => {
    const conf = REDES_CONFIG[tipoRed] || REDES_CONFIG.OTRO;
    switch (tipoRed) {
      case 'INSTAGRAM':
        return <InstagramBrandIcon size={size} color={conf.color} />;
      case 'WHATSAPP':
        return <WhatsAppBrandIcon size={size} color={conf.color} />;
      case 'TIKTOK':
        return <TikTokBrandIcon size={size} color={conf.color} />;
      case 'FACEBOOK':
        return <FacebookBrandIcon size={size} color={conf.color} />;
      default:
        return <OtherBrandIcon size={size} color={conf.color} />;
    }
  };

  const configActual = REDES_CONFIG[tipo] || REDES_CONFIG.OTRO;
  const urlValida = url.trim().startsWith('https://') && !errorUrl;

  return (
    <div className="card shadow-sm border-0 card-surface">
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                <InstagramBrandIcon size={20} color="var(--tenant-color-primario, #0071BC)" />
              </div>
              <h5 className="fw-bold mb-0">Redes Sociales y Canales Oficiales</h5>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Conecta los perfiles oficiales de tu barbería. Se mostrarán con sus iconos interactivos en la portada web y pie de página de tu sede.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={abrirModalCrear}
            className="d-inline-flex align-items-center gap-1.5 shadow-sm flex-shrink-0 text-nowrap"
          >
            <Plus size={16} /> Conectar Nueva Red
          </Button>
        </div>
      </div>

      <div className="card-body p-4">
        {cargando ? (
          <div className="text-center py-5 text-muted small">
            <span className="spinner-border spinner-border-sm me-2 text-primary" role="status" />
            Cargando redes sociales de la sede...
          </div>
        ) : redes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-5 px-3 border border-dashed rounded-4 bg-body-tertiary">
            <div
              className="d-inline-flex p-3 rounded-circle mb-3"
              style={{ background: 'rgba(194, 151, 82, 0.15)', color: '#c29752' }}
            >
              <InstagramBrandIcon size={32} color="#c29752" />
            </div>
            <h6 className="fw-bold mb-1">Aún no has conectado redes sociales</h6>
            <p className="text-muted small mb-3" style={{ maxWidth: 450, margin: '0 auto' }}>
              Añade los enlaces de Instagram, WhatsApp, TikTok o Facebook de tu barbería para que tus clientes puedan seguirte y contactarte directamente.
            </p>
            <Button type="button" variant="primary" size="sm" onClick={abrirModalCrear}>
              <Plus size={15} className="me-1" /> Conectar mi primera red
            </Button>
          </div>
        ) : (
          /* Lista de Redes Sociales */
          <div className="row g-3">
            {redes.map((red) => {
              const conf = REDES_CONFIG[red.tipo] || REDES_CONFIG.OTRO;

              return (
                <div key={red.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="card h-100 border transition-all bg-body-tertiary shadow-sm"
                    style={{
                      borderRadius: '16px',
                      opacity: red.activo ? 1 : 0.88,
                      borderColor: red.activo ? 'var(--bs-border-color)' : 'rgba(255, 193, 7, 0.3)',
                    }}
                  >
                    <div className="card-body p-3 d-flex flex-column justify-content-between gap-3">
                      {/* 1. Header: Icono + Nombre + Switch a la derecha */}
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2.5 min-w-0">
                          <div
                            className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                            style={{ background: conf.bg }}
                          >
                            {renderIcono(red.tipo, 22)}
                          </div>
                          <div className="text-truncate">
                            <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.95rem' }}>
                              {red.nombre}
                            </h6>
                            <span
                              className="text-body-secondary text-truncate d-block"
                              style={{ fontSize: '0.72rem' }}
                            >
                              {conf.label} {red.orden > 0 ? `· #${red.orden}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Switch de visibilidad personalizado (100% visible en modo oscuro y claro) */}
                        <label
                          className="redes-switch"
                          title={red.activo ? 'Pausar (ocultar de la web pública)' : 'Activar (hacer visible en la web)'}
                        >
                          <input
                            type="checkbox"
                            id={`switch-red-${red.id}`}
                            checked={red.activo}
                            disabled={cambiandoEstadoId === red.id}
                            onChange={() => handleToggleVisibilidad(red)}
                          />
                          <span className="redes-switch__slider" />
                        </label>
                      </div>

                      {/* 2. Cuerpo: Enlace de la red social */}
                      <div className="py-1">
                        <a
                          href={red.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-2 rounded-2 text-decoration-none text-body d-flex align-items-center justify-content-between gap-2 bg-body border"
                          style={{ fontSize: '0.78rem' }}
                          title={red.url}
                        >
                          <span className="text-truncate d-inline-flex align-items-center gap-1.5 text-primary">
                            <LinkIcon size={12} className="flex-shrink-0 text-muted" />
                            <span className="text-truncate">{red.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          </span>
                          <ExternalLink size={12} className="flex-shrink-0 text-muted" />
                        </a>
                      </div>

                      {/* 3. Footer: Estado (Visible / Oculta) + Botones Editar y Borrar */}
                      <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
                        <span
                          className={`badge ${
                            red.activo
                              ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                              : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                          } px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1.5`}
                          style={{ fontSize: '0.7rem', fontWeight: 600 }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: red.activo ? '#22c55e' : '#f59e0b',
                            }}
                          />
                          {red.activo ? 'Visible en web' : 'Pausada'}
                        </span>

                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-body p-1"
                            onClick={() => abrirModalEditar(red)}
                            title="Editar URL u orden"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-1"
                            onClick={() => handleSolicitarEliminar(red)}
                            title="Eliminar definitivamente"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Conectar / Editar Canal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={redEditando ? `Editar ${redEditando.nombre}` : 'Conectar Canal Oficial'}
        size="md"
      >
        <form onSubmit={handleGuardar} className="p-1">
          {/* 1. Selector Visual con Iconos Auténticos */}
          {!redEditando ? (
            <div className="mb-4">
              <label className="form-label small fw-bold text-uppercase tracking-wider text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                1. Selecciona la Plataforma
              </label>

              <div className="redes-selector-grid">
                {(Object.keys(REDES_CONFIG) as TipoRedSocial[]).map((tId) => {
                  const conf = REDES_CONFIG[tId];
                  const yaConectada = tId !== 'OTRO' && redes.some((r) => r.tipo === tId);
                  const esActivo = tipo === tId;

                  return (
                    <div
                      key={tId}
                      role="button"
                      tabIndex={yaConectada ? -1 : 0}
                      onClick={() => handleTipoChange(tId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleTipoChange(tId);
                      }}
                      className={`redes-selector-card ${esActivo ? 'redes-selector-card--active' : ''} ${
                        yaConectada ? 'redes-selector-card--disabled' : ''
                      }`}
                      style={
                        {
                          '--card-color': conf.color,
                          '--card-bg': conf.bg,
                        } as React.CSSProperties
                      }
                      title={yaConectada ? `${conf.label} ya está configurada en tu lista` : conf.descripcion}
                    >
                      <div className="redes-selector-card__icon" style={{ background: conf.bg }}>
                        {renderIcono(tId, 22)}
                      </div>
                      <span className="redes-selector-card__name">{conf.label}</span>

                      {yaConectada ? (
                        <span className="redes-selector-card__connected-badge">Conectada</span>
                      ) : esActivo ? (
                        <div className="redes-selector-card__check">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Badge de la red que se está editando */
            <div
              className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
              style={{
                background: configActual.bg,
                border: `1.5px solid ${configActual.color}`,
              }}
            >
              <div className="p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                {renderIcono(tipo, 24)}
              </div>
              <div>
                <h6 className="fw-bold mb-0">{configActual.label}</h6>
                <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
                  {configActual.descripcion}
                </span>
              </div>
            </div>
          )}

          {/* 2. Nombre Personalizado (solo para OTRO) */}
          {(tipo === 'OTRO' || redEditando?.tipo === 'OTRO') && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Nombre del Canal o Enlace <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Canal de YouTube, Blog de Estilo, Twitter / X"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                required
                disabled={guardando}
              />
            </div>
          )}

          {/* 3. URL Oficial con Botón Pegar */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold mb-0">
                URL Oficial del Perfil <span className="text-danger">*</span>
              </label>

              <button
                type="button"
                onClick={handlePegarPortapapeles}
                className="btn btn-sm btn-link text-decoration-none text-primary p-0 d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.78rem' }}
                title="Pegar desde el portapapeles"
              >
                <Clipboard size={12} /> Pegar enlace
              </button>
            </div>

            <div className="input-group">
              <span className="input-group-text bg-body-tertiary border-end-0">
                <LinkIcon size={14} className="text-muted" />
              </span>
              <input
                type="url"
                className={`form-control border-start-0 ${errorUrl ? 'is-invalid' : ''} ${
                  urlValida ? 'is-valid' : ''
                }`}
                placeholder={configActual.placeholder}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorUrl || e.target.value) validarUrl(e.target.value);
                }}
                required
                disabled={guardando}
              />
              {errorUrl && <div className="invalid-feedback">{errorUrl}</div>}
            </div>

            <div className="d-flex align-items-center gap-1.5 mt-1.5 text-muted small" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={13} className={urlValida ? 'text-success' : 'text-muted'} />
              <span>
                Debe comenzar con <strong className="text-body">https://</strong> para garantizar seguridad.
              </span>
            </div>
          </div>

          {/* 4. Previsualización en Vivo */}
          <div
            className="redes-preview-box"
            style={
              {
                '--card-color': configActual.color,
                '--card-bg': configActual.bg,
              } as React.CSSProperties
            }
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Sparkles size={12} className="text-warning" /> Vista previa para tus clientes:
              </span>
              <span className="badge bg-secondary bg-opacity-25 text-body-secondary" style={{ fontSize: '0.68rem' }}>
                Pie de página y Portada
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="redes-preview-pill">
                {renderIcono(tipo, 18)}
                <span>{tipo === 'OTRO' && nombre.trim() ? nombre : configActual.label}</span>
              </div>
              <span className="text-truncate text-muted small" style={{ fontSize: '0.75rem', maxWidth: '200px' }}>
                {url ? url.replace(/^https?:\/\//, '') : configActual.placeholder.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>

          {/* 5. Orden de Visualización */}
          <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-body-tertiary border mb-4">
            <div>
              <div className="fw-semibold small">Prioridad de Posición</div>
              <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                Posición en la lista de iconos (1 aparece de primero).
              </div>
            </div>

            <div className="redes-counter">
              <button
                type="button"
                className="redes-counter__btn"
                onClick={() => setOrden((prev) => Math.max(0, prev - 1))}
                disabled={orden <= 0 || guardando}
                title="Disminuir orden"
              >
                <Minus size={14} />
              </button>
              <span className="redes-counter__val">{orden}</span>
              <button
                type="button"
                className="redes-counter__btn"
                onClick={() => setOrden((prev) => prev + 1)}
                disabled={guardando}
                title="Aumentar orden"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={guardando}
              className="d-inline-flex align-items-center gap-1.5 px-3"
            >
              <Check size={15} />
              {redEditando ? 'Guardar Cambios' : 'Conectar Canal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Diálogo de Confirmación Elegante para Eliminar Definitivamente */}
      <ConfirmDialog
        isOpen={redAEliminar !== null}
        title={`¿Eliminar definitivamente ${redAEliminar?.nombre || 'red social'}?`}
        message={
          <div>
            <p className="mb-2">
              Se eliminará <strong>{redAEliminar?.nombre}</strong> y su enlace de tu panel de configuración.
            </p>
            <p className="text-muted small mb-0">
              💡 <em>Consejo:</em> Si solo quieres que no aparezca temporalmente en tu web pública, puedes usar el interruptor <strong>Visible / Oculta</strong> para pausarla sin perder tu enlace.
            </p>
          </div>
        }
        confirmLabel="Eliminar Definitivamente"
        cancelLabel="Conservar"
        variant="danger"
        isLoading={eliminando}
        onConfirm={confirmarEliminarRed}
        onCancel={() => !eliminando && setRedAEliminar(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  Power,
  Globe,
  Link as LinkIcon,
  MessageCircle,
} from 'lucide-react';
import { redesSocialesApi } from '../services/redesSocialesApi';
import type {
  RedSocial,
  TipoRedSocial,
  CrearRedSocialDto,
} from '../types/redesSociales.types';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import { useToastContext } from '../../../shared/ui/ToastContext';

interface RedesSocialesSectionProps {
  slugNegocio: string;
}

const REDES_CONFIG: Record<
  TipoRedSocial,
  { label: string; placeholder: string; color: string; bg: string }
> = {
  INSTAGRAM: {
    label: 'Instagram',
    placeholder: 'https://instagram.com/tu_barberia',
    color: '#E1306C',
    bg: 'rgba(225, 48, 108, 0.12)',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    placeholder: 'https://wa.me/573001234567',
    color: '#25D366',
    bg: 'rgba(37, 211, 102, 0.12)',
  },
  TIKTOK: {
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@tu_barberia',
    color: '#00f2fe',
    bg: 'rgba(0, 242, 254, 0.12)',
  },
  FACEBOOK: {
    label: 'Facebook',
    placeholder: 'https://facebook.com/tu_barberia',
    color: '#1877F2',
    bg: 'rgba(24, 119, 242, 0.12)',
  },
  OTRO: {
    label: 'Otro Enlace',
    placeholder: 'https://tusitio.com',
    color: '#c29752',
    bg: 'rgba(194, 151, 82, 0.12)',
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

  // Form State
  const [tipo, setTipo] = useState<TipoRedSocial>('INSTAGRAM');
  const [nombre, setNombre] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [orden, setOrden] = useState<number>(0);
  const [errorUrl, setErrorUrl] = useState<string>('');

  const cargarRedes = async () => {
    try {
      setCargando(true);
      const data = await redesSocialesApi.listar();
      setRedes(data);
    } catch (err: any) {
      console.error('Error cargando redes sociales:', err);
      showToast('danger', 'No se pudieron cargar las redes sociales del negocio.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRedes();
  }, [slugNegocio]);

  const abrirModalCrear = () => {
    setRedEditando(null);
    setTipo('INSTAGRAM');
    setNombre('Instagram');
    setUrl('');
    setOrden(redes.length);
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
    setTipo(nuevoTipo);
    if (nuevoTipo !== 'OTRO') {
      setNombre(REDES_CONFIG[nuevoTipo].label);
    } else {
      setNombre('');
    }
  };

  const validarUrl = (val: string): boolean => {
    if (!val.trim()) {
      setErrorUrl('La URL es requerida.');
      return false;
    }
    if (!val.startsWith('https://')) {
      setErrorUrl('La URL debe comenzar estrictamente con https://');
      return false;
    }
    try {
      new URL(val);
      setErrorUrl('');
      return true;
    } catch {
      setErrorUrl('Por favor introduce una dirección URL válida.');
      return false;
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarUrl(url)) return;

    setGuardando(true);
    try {
      if (redEditando) {
        // Actualizar existente
        await redesSocialesApi.actualizar(redEditando.id, {
          url: url.trim(),
          orden: Number(orden) || 0,
          ...(redEditando.tipo === 'OTRO' ? { nombre: nombre.trim() } : {}),
        });
        showToast('success', `Red social ${redEditando.nombre} actualizada correctamente.`);
      } else {
        // Crear nueva red reemplazando o añadiendo a la lista
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
        showToast('success', 'Red social agregada correctamente.');
      }

      setModalOpen(false);
      await cargarRedes();
    } catch (err: any) {
      console.error('Error guardando red social:', err);
      const msg = err.response?.data?.message || 'Error al guardar la red social.';
      showToast('danger', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (red: RedSocial) => {
    try {
      if (red.activo) {
        await redesSocialesApi.desactivar(red.id);
        showToast('info', `${red.nombre} ha sido ocultada del catálogo público.`);
      } else {
        await redesSocialesApi.activar(red.id);
        showToast('success', `${red.nombre} ahora es visible para los clientes.`);
      }
      await cargarRedes();
    } catch (err: any) {
      console.error('Error alternando estado de red:', err);
      const msg = err.response?.data?.message || 'No fue posible cambiar el estado de la red.';
      showToast('danger', Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleEliminarRed = async (red: RedSocial) => {
    if (!window.confirm(`¿Deseas retirar ${red.nombre} del perfil de la barbería?`)) return;
    try {
      // Reemplazar la lista excluyendo esta red
      const filtradas: CrearRedSocialDto[] = redes
        .filter((r) => r.id !== red.id)
        .map((r) => ({
          tipo: r.tipo,
          nombre: r.nombre,
          url: r.url,
          orden: r.orden,
        }));
      await redesSocialesApi.reemplazar(filtradas);
      showToast('success', `${red.nombre} fue eliminada del perfil.`);
      await cargarRedes();
    } catch (err: any) {
      console.error('Error eliminando red social:', err);
      showToast('danger', 'Error al eliminar la red social.');
    }
  };

  const renderIcono = (tipoRed: TipoRedSocial) => {
    switch (tipoRed) {
      case 'WHATSAPP':
        return <MessageCircle size={20} color={REDES_CONFIG.WHATSAPP.color} />;
      case 'INSTAGRAM':
      case 'FACEBOOK':
      case 'TIKTOK':
        return <Share2 size={20} color={REDES_CONFIG[tipoRed].color} />;
      default:
        return <Globe size={20} color={REDES_CONFIG.OTRO.color} />;
    }
  };

  return (
    <div className="card shadow-sm border-0 card-surface">
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                <Share2 size={20} />
              </div>
              <h5 className="fw-bold mb-0">Redes Sociales y Enlaces Oficiales</h5>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Conecta los canales oficiales de tu barbería. Se mostrarán en la portada web y pie de página de tu sede.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={abrirModalCrear}
            className="d-inline-flex align-items-center gap-1.5"
          >
            <Plus size={16} /> Agregar Red Social
          </Button>
        </div>
      </div>

      <div className="card-body p-4">
        {cargando ? (
          <div className="text-center py-5 text-muted small">
            <span className="spinner-border spinner-border-sm me-2" role="status" />
            Cargando redes sociales...
          </div>
        ) : redes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-5 px-3 border border-dashed rounded-4 bg-body-tertiary">
            <div
              className="d-inline-flex p-3 rounded-circle mb-3"
              style={{ background: 'rgba(194, 151, 82, 0.15)', color: '#c29752' }}
            >
              <Share2 size={32} />
            </div>
            <h6 className="fw-bold mb-1">Aún no has conectado redes sociales</h6>
            <p className="text-muted small mb-3" style={{ maxWidth: 450, margin: '0 auto' }}>
              Añade los enlaces de Instagram, WhatsApp, TikTok o Facebook de tu barbería para que tus clientes puedan seguirte y contactarte directamente.
            </p>
            <Button type="button" variant="outline-primary" size="sm" onClick={abrirModalCrear}>
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
                    className={`card h-100 border transition-all ${
                      red.activo ? 'bg-body-tertiary shadow-sm' : 'opacity-75 bg-body-secondary'
                    }`}
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="card-body p-3 d-flex flex-column justify-content-between gap-3">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="p-2 rounded-3 d-flex align-items-center justify-content-center"
                            style={{ background: conf.bg }}
                          >
                            {renderIcono(red.tipo)}
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: 170 }}>
                              {red.nombre}
                            </h6>
                            <span className="badge bg-secondary bg-opacity-25 text-body-secondary mt-0.5" style={{ fontSize: '0.68rem' }}>
                              {conf.label} {red.orden > 0 ? `· Orden ${red.orden}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Switch de Activo / Inactivo */}
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(red)}
                          className={`btn btn-sm py-0.5 px-2 rounded-pill d-inline-flex align-items-center gap-1 border-0 ${
                            red.activo ? 'btn-success bg-opacity-15 text-success' : 'btn-secondary bg-opacity-15 text-muted'
                          }`}
                          style={{ fontSize: '0.72rem' }}
                          title={red.activo ? 'Ocultar al público' : 'Hacer visible'}
                        >
                          <Power size={11} /> {red.activo ? 'Visible' : 'Oculta'}
                        </button>
                      </div>

                      {/* URL y Enlace Externo */}
                      <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
                        <a
                          href={red.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-truncate small text-decoration-none text-primary d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.8rem', maxWidth: '70%' }}
                          title={red.url}
                        >
                          <LinkIcon size={12} className="flex-shrink-0" />
                          <span className="text-truncate">{red.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <ExternalLink size={11} className="flex-shrink-0" />
                        </a>

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
                            onClick={() => handleEliminarRed(red)}
                            title="Eliminar red social"
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

      {/* Modal: Crear / Editar Red Social */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={redEditando ? `Editar ${redEditando.nombre}` : 'Agregar Red Social Oficial'}
        size="md"
      >
        <form onSubmit={handleGuardar} className="p-1">
          <p className="small text-muted mb-3">
            Ingresa la URL pública de tu cuenta o perfil. El enlace debe ser seguro (HTTPS) y apuntar a tu página oficial.
          </p>

          {/* Selector de Tipo (solo al crear) */}
          {!redEditando && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">Tipo de Red Social</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => handleTipoChange(e.target.value as TipoRedSocial)}
                disabled={guardando}
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp (wa.me)</option>
                <option value="TIKTOK">TikTok</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="OTRO">Otro Enlace Personalizado</option>
              </select>
            </div>
          )}

          {/* Nombre (para tipo OTRO) */}
          {(tipo === 'OTRO' || redEditando?.tipo === 'OTRO') && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Nombre de la Red o Enlace <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Canal de YouTube, Twitter, Blog"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                required
                disabled={guardando}
              />
            </div>
          )}

          {/* URL */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              URL Oficial (HTTPS) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-body-tertiary">
                <LinkIcon size={14} className="text-muted" />
              </span>
              <input
                type="url"
                className={`form-control ${errorUrl ? 'is-invalid' : ''}`}
                placeholder={REDES_CONFIG[tipo]?.placeholder || 'https://...'}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorUrl) validarUrl(e.target.value);
                }}
                required
                disabled={guardando}
              />
              {errorUrl && <div className="invalid-feedback">{errorUrl}</div>}
            </div>
            <div className="form-text small text-muted">
              Debe comenzar estrictamente con <code>https://</code>
            </div>
          </div>

          {/* Orden de Visualización */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Orden de Visualización</label>
            <input
              type="number"
              className="form-control"
              min={0}
              max={99}
              value={orden}
              onChange={(e) => setOrden(parseInt(e.target.value, 10) || 0)}
              disabled={guardando}
            />
            <div className="form-text small text-muted">
              Las redes con menor número se mostrarán primero a los clientes.
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={guardando}>
              {redEditando ? 'Guardar Cambios' : 'Agregar Red'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

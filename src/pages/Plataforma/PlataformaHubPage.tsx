import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ExternalLink,
  Plus,
  Search,
  Scissors,
  Calendar,
  MapPin,
  Power,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import BrandLogo from '../../shared/ui/BrandLogo';
import KyriosSpinner from '../../shared/ui/KyriosSpinner';
import Modal from '../../shared/ui/Modal';
import Button from '../../shared/ui/Button';
import { useConfirm } from '../../shared/contexts/ConfirmContext';
import bannerImg from '../../assets/brand/banner.png';
import './PlataformaHubPage.css';

/**
 * DTO Público del Hub de Negocios de Plataforma
 * Respaldado por GET /plataforma/negocios/publico
 */
interface NegocioPublico {
  id: number;
  nombre: string;
  slug: string;
  ciudad?: string | null;
  logoBlancoUrl?: string | null;
  bannerUrl?: string | null;
  frasePrincipal?: string | null;
}

export default function PlataformaHubPage() {
  const confirm = useConfirm();
  const [negocios, setNegocios] = useState<NegocioPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Modal Crear Barbería
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoSlug, setNuevoSlug] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoAdminEmail, setNuevoAdminEmail] = useState('');
  const [nuevoAdminNombre, setNuevoAdminNombre] = useState('');
  const [nuevoAdminApellido, setNuevoAdminApellido] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null);

  // Cargar lista pública de barberías de la plataforma
  const cargarNegocios = async () => {
    setCargando(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/plataforma/negocios/publico`;
      const res = await axios.get<NegocioPublico[]>(url);
      setNegocios(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'No fue posible cargar las barberías de la plataforma.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarNegocios();
  }, []);

  // Generar slug automático al tipear nombre
  const handleNombreChange = (val: string) => {
    setNuevoNombre(val);
    const slugAutogenerado = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNuevoSlug(slugAutogenerado);
  };

  // Crear nueva barbería (requiere credenciales de plataforma admin)
  const handleCrearBarberia = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setErrorCreacion(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/plataforma/negocios`;
      await axios.post(url, {
        nombre: nuevoNombre,
        slug: nuevoSlug,
        direccion: nuevaDireccion || undefined,
        adminEmail: nuevoAdminEmail ? nuevoAdminEmail.trim() : undefined,
        adminNombre: nuevoAdminNombre ? nuevoAdminNombre.trim() : undefined,
        adminApellido: nuevoAdminApellido ? nuevoAdminApellido.trim() : undefined,
      });
      setModalCrearOpen(false);
      setNuevoNombre('');
      setNuevoSlug('');
      setNuevaDireccion('');
      setNuevoAdminEmail('');
      setNuevoAdminNombre('');
      setNuevoAdminApellido('');
      void cargarNegocios();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setErrorCreacion(
          'Acción restringida: Crear barberías requiere permisos de Administrador de Plataforma autorizados en backend (PLATFORM_ADMIN_EMAILS).'
        );
      } else {
        setErrorCreacion(err?.response?.data?.message || 'Error al crear la barbería.');
      }
    } finally {
      setCreando(false);
    }
  };

    // Alternar estado ACTIVO / INACTIVO (requiere credenciales de plataforma admin)
  const handleToggleEstado = async (negocio: NegocioPublico) => {
    const confirmado = await confirm({
      title: 'Suspender Barbería',
      message: `¿Estás seguro de cambiar el estado de "${negocio.nombre}" a INACTIVO?`,
      confirmLabel: 'Suspender barbería',
      cancelLabel: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmado) return;

    try {
      const url = `${import.meta.env.VITE_API_URL}/plataforma/negocios/${negocio.id}/estado`;
      await axios.patch(url, { estado: 'INACTIVO' });
      void cargarNegocios();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        void confirm({
          title: 'Acción Restringida',
          message: 'Suspender o activar barberías requiere permisos de Administrador de Plataforma autorizados en backend (PLATFORM_ADMIN_EMAILS).',
          confirmLabel: 'Entendido',
          variant: 'primary',
        });
      } else {
        void confirm({
          title: 'Error de Plataforma',
          message: err?.response?.data?.message || 'No se pudo cambiar el estado de la barbería.',
          confirmLabel: 'Cerrar',
          variant: 'danger',
        });
      }
    }
  };

  // Filtrado de búsqueda
  const negociosFiltrados = negocios.filter(
    (n) =>
      n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.slug.toLowerCase().includes(busqueda.toLowerCase()) ||
      (n.ciudad && n.ciudad.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="hub-plataforma">
      <div className="hub-plataforma__glow" aria-hidden="true" />
      <div className="hub-plataforma__grid" aria-hidden="true" />

      <div className="hub-plataforma__container">
        {/* Barra Superior */}
        <header className="hub-plataforma__top-bar">
          <Link
            to="/"
            className="d-flex align-items-center gap-3 text-decoration-none"
            title="Ir a la página principal de la plataforma"
          >
            <BrandLogo variant="white" height={34} alt="Kyrios Studio" />
            <span className="hub-plataforma__badge">
              <Sparkles size={11} /> Consola de Plataforma Multitenant
            </span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="btn-volver-landing">
              <ArrowLeft size={16} />
              <span>Volver a la Web Principal</span>
            </Link>
            <button
              type="button"
              className="btn-crear-barberia"
              onClick={() => setModalCrearOpen(true)}
            >
              <Plus size={16} /> Crear Nueva Barbería
            </button>
          </div>
        </header>

        {/* Hero Central */}
        <div className="hub-plataforma__hero">
          <h1 className="hub-plataforma__title">Directorio de Barberías</h1>
          <p className="hub-plataforma__subtitle">
            Explora las sedes activas en la red SaaS. Cada barbería cuenta con catálogo, agenda,
            equipo y portal de clientes totalmente aislado.
          </p>

          {/* Estadísticas de la red */}
          <div className="hub-plataforma__stats">
            <div className="hub-plataforma__stat-pill">
              <div className="hub-plataforma__stat-icon">
                <Building2 size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">{negocios.length}</div>
                <div className="hub-plataforma__stat-label">Sedes Registradas</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div
                className="hub-plataforma__stat-icon"
                style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)' }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">Aislamiento</div>
                <div className="hub-plataforma__stat-label">100% Multitenant</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div
                className="hub-plataforma__stat-icon"
                style={{ color: '#c29752', background: 'rgba(194, 151, 82, 0.15)' }}
              >
                <Globe size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">Público</div>
                <div className="hub-plataforma__stat-label">Catálogo Abierto</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div
                className="hub-plataforma__stat-icon"
                style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)' }}
              >
                <ShieldCheck size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">Seguro</div>
                <div className="hub-plataforma__stat-label">Red Blindada</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar de Búsqueda */}
        <div className="hub-plataforma__toolbar">
          <div className="hub-plataforma__search">
            <Search size={16} className="hub-plataforma__search-icon" />
            <input
              type="text"
              className="hub-plataforma__search-input"
              placeholder="Buscar barbería por nombre, ciudad o slug..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="small text-muted">
            Mostrando <strong>{negociosFiltrados.length}</strong> de {negocios.length} sedes
          </div>
        </div>

        {/* Estado de Carga / Error */}
        {cargando && (
          <div className="text-center py-5">
            <KyriosSpinner size="lg" mensaje="Cargando directorio de barberías..." />
          </div>
        )}

        {error && (
          <div className="alert alert-danger p-3 rounded-4 mb-4" role="alert">
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Grid de Barberías */}
        {!cargando && !error && (
          <div className="hub-plataforma__cards-grid">
            {negociosFiltrados.map((negocio) => {
              const urlSitio = `/${negocio.slug}`;
              const urlReservas = `/${negocio.slug}/reservar`;
              const urlLogin = `/${negocio.slug}/login`;

              return (
                <article key={negocio.id} className="hub-card">
                  {/* Banner superior */}
                  <div
                    className="hub-card__banner"
                    style={{ backgroundImage: `url(${negocio.bannerUrl || bannerImg})` }}
                  >
                    <div className="hub-card__banner-overlay" />
                    <span className="hub-card__status-chip chip--ACTIVO">● ACTIVO</span>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="hub-card__body">
                    <div>
                      <h2 className="hub-card__title">{negocio.nombre}</h2>
                      <span className="hub-card__slug">/{negocio.slug}</span>

                      <div className="hub-card__location">
                        <MapPin size={14} className="text-primary flex-shrink-0" />
                        <span className="text-truncate">
                          {negocio.ciudad || 'Colombia'}
                        </span>
                      </div>

                      {negocio.frasePrincipal && (
                        <p className="small text-muted mb-3 fst-italic text-truncate" title={negocio.frasePrincipal}>
                          "{negocio.frasePrincipal}"
                        </p>
                      )}
                    </div>

                    {/* Acciones para Abrir en otra pestaña */}
                    <div className="hub-card__actions">
                      <a
                        href={urlSitio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hub-card__launch-btn"
                        title="Abrir la landing pública de esta sede en otra pestaña"
                      >
                        <span>Abrir Sitio Web</span>
                        <ExternalLink size={15} />
                      </a>

                      <div className="hub-card__secondary-actions">
                        <a
                          href={urlReservas}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hub-card__booking-btn"
                          title="Abrir el wizard de reservas de esta sede"
                        >
                          <Calendar size={13} /> Reservar
                        </a>

                        <a
                          href={urlLogin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hub-card__booking-btn"
                          title="Abrir el acceso de personal de esta sede"
                        >
                          <Scissors size={13} /> Panel
                        </a>

                        <button
                          type="button"
                          className="hub-card__toggle-btn"
                          onClick={() => void handleToggleEstado(negocio)}
                          title="Alternar estado (Requiere credenciales de plataforma)"
                        >
                          <Power size={14} className="text-success" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: Crear Nueva Barbería */}
        <Modal
          isOpen={modalCrearOpen}
          onClose={() => setModalCrearOpen(false)}
          title="Crear Nueva Barbería en el Tenant"
          size="md"
          className="hub-plataforma-modal"
        >
          <form onSubmit={handleCrearBarberia} className="p-1">
            <p className="small text-muted mb-3">
              Registra una nueva sede o sucursal. Se creará de forma aislada en la base de datos con su
              propia URL y configuración.
            </p>

            {errorCreacion && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {errorCreacion}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="hub-nombre-barberia" className="form-label small fw-semibold text-white">
                Nombre de la Barbería <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="hub-nombre-barberia"
                placeholder="Ej. Kyrios Studio Centro"
                value={nuevoNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="hub-slug-barberia" className="form-label small fw-semibold text-white">
                Slug (Ruta Web Única) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-muted small">/</span>
                <input
                  type="text"
                  className="form-control"
                  id="hub-slug-barberia"
                  placeholder="kyrios-centro"
                  value={nuevoSlug}
                  onChange={(e) => setNuevoSlug(e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Solo letras minúsculas, números y guiones sencillos"
                  required
                />
              </div>
              <div className="form-text small text-muted">
                Identificador URL: barberia.com/<strong>{nuevoSlug || 'tu-slug'}</strong>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="hub-direccion-barberia" className="form-label small fw-semibold text-white">
                Dirección Física (Opcional)
              </label>
              <input
                type="text"
                className="form-control"
                id="hub-direccion-barberia"
                placeholder="Ej. Calle 4 # 5-20, Centro Histórico"
                value={nuevaDireccion}
                onChange={(e) => setNuevaDireccion(e.target.value)}
              />
            </div>

            <div className="border-top border-secondary pt-3 mt-3">
              <h6 className="small fw-bold text-white mb-2">Administrador Inicial (Opcional)</h6>
              <p className="small text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                Si especificas un correo existente, será asignado como Administrador Fundador
                (superadmin) de esta nueva sede.
              </p>

              <div className="mb-2">
                <input
                  type="email"
                  className="form-control form-control-sm"
                  placeholder="correo.admin@ejemplo.com"
                  value={nuevoAdminEmail}
                  onChange={(e) => setNuevoAdminEmail(e.target.value)}
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nombre"
                    value={nuevoAdminNombre}
                    onChange={(e) => setNuevoAdminNombre(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Apellido"
                    value={nuevoAdminApellido}
                    onChange={(e) => setNuevoAdminApellido(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={() => setModalCrearOpen(false)}
                disabled={creando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={creando}>
                Crear Barbería
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

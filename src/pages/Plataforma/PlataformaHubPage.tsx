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
} from 'lucide-react';
import BrandLogo from '../../shared/ui/BrandLogo';
import KyriosSpinner from '../../shared/ui/KyriosSpinner';
import Modal from '../../shared/ui/Modal';
import Button from '../../shared/ui/Button';
import bannerImg from '../../assets/brand/banner.png';
import './PlataformaHubPage.css';

interface NegocioPlataforma {
  id: number;
  nombre: string;
  slug: string;
  estado: 'ACTIVO' | 'INACTIVO';
  zonaHoraria: string;
  perfil?: {
    direccion?: string | null;
    ciudad?: string | null;
    frasePrincipal?: string | null;
    bannerUrl?: string | null;
  } | null;
  estadisticas: {
    totalBarberos: number;
    totalServicios: number;
    totalReservas: number;
    totalClientes: number;
  };
}

export default function PlataformaHubPage() {
  const [negocios, setNegocios] = useState<NegocioPlataforma[]>([]);
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

  // Cargar lista de barberías de la plataforma
  const cargarNegocios = async () => {
    setCargando(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/plataforma/negocios`;
      const res = await axios.get<NegocioPlataforma[]>(url);
      setNegocios(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible cargar las barberías de la plataforma.');
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

  // Crear nueva barbería
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
      setErrorCreacion(err?.response?.data?.message || 'Error al crear la barbería.');
    } finally {
      setCreando(false);
    }
  };

  // Alternar estado ACTIVO / INACTIVO
  const handleToggleEstado = async (negocio: NegocioPlataforma) => {
    const nuevoEstado = negocio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const url = `${import.meta.env.VITE_API_URL}/plataforma/negocios/${negocio.id}/estado`;
      await axios.patch(url, { estado: nuevoEstado });
      setNegocios((prev) =>
        prev.map((n) => (n.id === negocio.id ? { ...n, estado: nuevoEstado } : n))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo cambiar el estado de la barbería.');
    }
  };

  // Métricas globales
  const totalActivas = negocios.filter((n) => n.estado === 'ACTIVO').length;
  const totalBarberos = negocios.reduce((acc, n) => acc + (n.estadisticas?.totalBarberos || 0), 0);
  const totalCitas = negocios.reduce((acc, n) => acc + (n.estadisticas?.totalReservas || 0), 0);

  // Filtrado
  const negociosFiltrados = negocios.filter(
    (n) =>
      n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.slug.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1 className="hub-plataforma__title">
            Directorio de Barberías
          </h1>
          <p className="hub-plataforma__subtitle">
            Explora las sedes activas en el tenant. Cada barbería cuenta con catálogo, agenda, equipo y portal de clientes totalmente aislado.
          </p>

          {/* Estadísticas de la red */}
          <div className="hub-plataforma__stats">
            <div className="hub-plataforma__stat-pill">
              <div className="hub-plataforma__stat-icon">
                <Building2 size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">{negocios.length}</div>
                <div className="hub-plataforma__stat-label">Sedes Totales</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div className="hub-plataforma__stat-icon" style={{ color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">{totalActivas}</div>
                <div className="hub-plataforma__stat-label">Sedes Activas</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div className="hub-plataforma__stat-icon" style={{ color: '#c29752', background: 'rgba(194, 151, 82, 0.15)' }}>
                <Scissors size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">{totalBarberos}</div>
                <div className="hub-plataforma__stat-label">Barberos en Red</div>
              </div>
            </div>

            <div className="hub-plataforma__stat-pill">
              <div className="hub-plataforma__stat-icon" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)' }}>
                <Calendar size={18} />
              </div>
              <div className="text-start">
                <div className="hub-plataforma__stat-value">{totalCitas}</div>
                <div className="hub-plataforma__stat-label">Citas Agendadas</div>
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
              placeholder="Buscar barbería por nombre o slug..."
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

        {/* Grid de Barberías (Tipo Posters Netflix) */}
        {!cargando && !error && (
          <div className="hub-grid">
            {negociosFiltrados.map((negocio) => {
              const urlSitio = `${window.location.origin}/${negocio.slug}`;
              const urlReservas = `${window.location.origin}/${negocio.slug}/reservar`;
              const urlLogin = `${window.location.origin}/${negocio.slug}/login`;

              return (
                <article
                  key={negocio.id}
                  className={`hub-card ${negocio.estado === 'INACTIVO' ? 'hub-card--inactiva' : ''}`}
                >
                  {/* Banner superior */}
                  <div
                    className="hub-card__banner"
                    style={{ backgroundImage: `url(${bannerImg})` }}
                  >
                    <div className="hub-card__banner-overlay" />
                    <span className={`hub-card__status-chip chip--${negocio.estado}`}>
                      ● {negocio.estado}
                    </span>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="hub-card__body">
                    <div>
                      <h2 className="hub-card__title">{negocio.nombre}</h2>
                      <span className="hub-card__slug">/{negocio.slug}</span>

                      <div className="hub-card__location">
                        <MapPin size={14} className="text-primary flex-shrink-0" />
                        <span className="text-truncate">
                          {negocio.perfil?.direccion || 'Popayán, Cauca'}
                        </span>
                      </div>

                      {/* Métricas rápidas */}
                      <div className="hub-card__metrics">
                        <div className="hub-card__metric-item">
                          <span className="hub-card__metric-val">
                            {negocio.estadisticas?.totalBarberos || 0}
                          </span>
                          <span className="hub-card__metric-lbl">Barberos</span>
                        </div>
                        <div className="hub-card__metric-item">
                          <span className="hub-card__metric-val">
                            {negocio.estadisticas?.totalServicios || 0}
                          </span>
                          <span className="hub-card__metric-lbl">Servicios</span>
                        </div>
                      </div>
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
                          title={
                            negocio.estado === 'ACTIVO'
                              ? 'Desactivar barbería'
                              : 'Activar barbería'
                          }
                        >
                          <Power size={14} className={negocio.estado === 'ACTIVO' ? 'text-success' : 'text-danger'} />
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
              Registra una nueva sede o sucursal. Se creará de forma aislada en la base de datos con su propia URL y configuración.
            </p>

            {errorCreacion && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {errorCreacion}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-white">
                Nombre de la Barbería <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Ej. Barbería El Bosque"
                value={nuevoNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-white">
                Slug en URL <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-secondary border-secondary text-white small">
                  /
                </span>
                <input
                  type="text"
                  className="form-control bg-dark border-secondary text-white font-monospace"
                  placeholder="barberia-el-bosque"
                  value={nuevoSlug}
                  onChange={(e) => setNuevoSlug(e.target.value)}
                  required
                />
              </div>
              <div className="form-text small text-muted">
                Este slug definirá la URL de acceso: <code>/{nuevoSlug || 'mi-barberia'}</code>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-white">
                Dirección / Ubicación (Opcional)
              </label>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Ej. Transversal 9A Norte # 15-32"
                value={nuevaDireccion}
                onChange={(e) => setNuevaDireccion(e.target.value)}
              />
            </div>

            {/* Asignación de Dueño / Superadministrador */}
            <div className="p-3 rounded-3 mb-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-info" />
                <span className="small fw-bold text-white">Dueño / Superadministrador Inicial</span>
              </div>
              <p className="small text-muted mb-2">
                Asigna el correo de Google de la persona que administrará esta barbería con permisos totales.
              </p>

              <div className="mb-2">
                <label className="form-label small fw-semibold text-white">
                  Correo de Google del Dueño <span className="text-info small">(Recomendado)</span>
                </label>
                <input
                  type="email"
                  className="form-control form-control-sm bg-dark border-secondary text-white"
                  placeholder="ejemplo@gmail.com"
                  value={nuevoAdminEmail}
                  onChange={(e) => setNuevoAdminEmail(e.target.value)}
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-white">Nombre</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-dark border-secondary text-white"
                    placeholder="Carlos"
                    value={nuevoAdminNombre}
                    onChange={(e) => setNuevoAdminNombre(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-white">Apellido</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-dark border-secondary text-white"
                    placeholder="Pérez"
                    value={nuevoAdminApellido}
                    onChange={(e) => setNuevoAdminApellido(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => setModalCrearOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={creando}
                loadingText="Creando..."
              >
                Crear Barbería
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

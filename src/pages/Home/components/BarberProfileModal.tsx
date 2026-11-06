import React, { useState } from 'react';
import {
  Heart,
  Share2,
  X,
  Star,
  Scissors,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  MapPin,
  Users,
  Award,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import type { Servicio } from '../../../features/servicios/types/servicios.types';
import { useServiciosPorBarbero } from '../../../features/servicios/api/servicios.facade';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import Modal from '../../../shared/ui/Modal';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import './BarberProfileModal.css';

export interface BarberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  barbero: BarberoCatalogo | null;
  onReservar: (barbero: BarberoCatalogo, servicioId?: number) => void;
}

type TabType = 'perfil' | 'servicios' | 'portfolio' | 'resenas';

function formatearPrecio(valor: number | string): string {
  const num = typeof valor === 'number' ? valor : Number(valor) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
}

interface TabServiciosBarberoProps {
  cargando: boolean;
  error: any;
  servicios: Servicio[];
  barbero: BarberoCatalogo;
  onReservar: (barbero: BarberoCatalogo, servicioId: number) => void;
  onClose: () => void;
}

const TabServiciosBarbero: React.FC<TabServiciosBarberoProps> = ({
  cargando,
  error,
  servicios,
  barbero,
  onReservar,
  onClose,
}) => {
  if (cargando) {
    return (
      <div className="text-center py-4 d-flex flex-column align-items-center justify-content-center">
        <KyriosSpinner size="sm" />
        <span className="small text-muted mt-2">Cargando servicios del barbero...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 px-2">
        <AlertCircle size={24} className="text-danger mb-2" />
        <p className="small text-muted mb-0">
          No pudimos cargar los servicios de este barbero en este momento.
        </p>
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="text-center py-4 px-2">
        <Scissors size={28} className="text-secondary opacity-50 mb-2" />
        <p className="small text-muted mb-1">
          Este barbero no tiene servicios asignados actualmente en el sistema.
        </p>
      </div>
    );
  }

  const nombreCompleto = `${barbero.nombre} ${barbero.apellido}`.trim();

  return (
    <div className="barber-modal-service-list">
      {servicios.map((servicio) => (
        <button
          key={servicio.id}
          type="button"
          className="barber-modal-service-item barber-modal-service-item--interactive w-100 text-start border-0 bg-transparent p-0"
          onClick={() => {
            onReservar(barbero, servicio.id);
            onClose();
          }}
          title={`Reservar ${servicio.nombre} con ${nombreCompleto}`}
        >
          <div className="barber-modal-service-main">
            <div className="barber-modal-service-icon">
              <Scissors size={16} className="barber-modal-scissor-icon" />
            </div>
            <div className="barber-modal-service-info">
              <h4 className="barber-modal-service-name">{servicio.nombre}</h4>
              <div className="barber-modal-service-meta">
                <span className="barber-modal-service-duration">
                  <Clock size={12} />
                  <span>{servicio.duracionMinutos} min</span>
                </span>
                {servicio.descripcion && (
                  <span className="barber-modal-service-desc" title={servicio.descripcion}>
                    · {servicio.descripcion}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="barber-modal-service-side">
            <span className="barber-modal-service-price">{formatearPrecio(servicio.precio)}</span>
            <span className="barber-modal-service-cta-badge">Elegir</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export const BarberProfileModal: React.FC<BarberProfileModalProps> = ({
  isOpen,
  onClose,
  barbero,
  onReservar,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [esFavorito, setEsFavorito] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Consulta dinámica de los servicios asociados al barbero en la base de datos
  const {
    data: servicios = [],
    isLoading: cargandoServicios,
    error: errorServicios,
  } = useServiciosPorBarbero(isOpen && barbero ? barbero.id : null);

  if (!barbero) return null;

  const fotoUrl = obtenerUrlFoto(barbero.fotoUrl);
  const nombreCompleto = `${barbero.nombre} ${barbero.apellido}`.trim();
  const iniciales = `${barbero.nombre.charAt(0)}${barbero.apellido.charAt(0)}`.toUpperCase();

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2200);
      }
    } catch {
      // noop
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      hideHeader={true}
      className="barber-profile-dialog"
    >
      <div className="barber-modal-card">
        {/* Barra superior de acciones (Favorito, Compartir, Cerrar) */}
        <div className="barber-modal-topbar">
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="barber-modal-btn-icon"
              onClick={() => setEsFavorito((prev) => !prev)}
              aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              title={esFavorito ? 'En tus favoritos' : 'Guardar en favoritos'}
            >
              <Heart
                size={20}
                color={esFavorito ? '#ef4444' : 'currentColor'}
                fill={esFavorito ? '#ef4444' : 'none'}
              />
            </button>

            <button
              type="button"
              className="barber-modal-btn-icon"
              onClick={handleShare}
              aria-label="Compartir perfil"
              title={copiado ? '¡Enlace copiado!' : 'Compartir perfil'}
            >
              {copiado ? <Check size={18} color="#10B981" /> : <Share2 size={19} />}
            </button>

            {copiado && (
              <span className="badge bg-success-subtle text-success small py-1 px-2 animate-fade">
                ¡Enlace copiado!
              </span>
            )}
          </div>

          <button
            type="button"
            className="barber-modal-btn-icon"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            <X size={22} />
          </button>
        </div>

        {/* Avatar Central Hero */}
        <div className="barber-modal-avatar-wrap">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={nombreCompleto}
              className="barber-modal-avatar"
              loading="lazy"
            />
          ) : (
            <div className="barber-modal-avatar-fallback">{iniciales}</div>
          )}
        </div>

        {/* Nombre y Especialidad */}
        <h3 className="barber-modal-name">{nombreCompleto}</h3>

        <div className="barber-modal-badges">
          <span className="barber-modal-badge-item barber-modal-badge-role">
            <Sparkles size={14} />
            <span>VIP Master Barber</span>
          </span>
          <span className="barber-modal-badge-item barber-modal-badge-rating">
            <Star size={14} fill="var(--home-gold, #c6a875)" color="var(--home-gold, #c6a875)" />
            <span>4.9</span>
            <span className="barber-modal-rating-count">(239 reseñas)</span>
          </span>
        </div>

        <p className="barber-modal-sede">
          <MapPin size={14} className="barber-modal-sede-icon" />
          <span>Sede Principal · Kyrios Studio Barber</span>
        </p>

        {/* Pills de Navegación (Tabs) */}
        <div className="barber-modal-pills" role="tablist">
          <button
            type="button"
            className={`barber-modal-pill ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
            role="tab"
            aria-selected={activeTab === 'perfil'}
          >
            Perfil
          </button>
          <button
            type="button"
            className={`barber-modal-pill ${activeTab === 'servicios' ? 'active' : ''}`}
            onClick={() => setActiveTab('servicios')}
            role="tab"
            aria-selected={activeTab === 'servicios'}
          >
            Servicios {servicios.length > 0 ? `(${servicios.length})` : ''}
          </button>
          <button
            type="button"
            className={`barber-modal-pill ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
            role="tab"
            aria-selected={activeTab === 'portfolio'}
          >
            Portafolio (3)
          </button>
          <button
            type="button"
            className={`barber-modal-pill ${activeTab === 'resenas' ? 'active' : ''}`}
            onClick={() => setActiveTab('resenas')}
            role="tab"
            aria-selected={activeTab === 'resenas'}
          >
            Reseñas (239)
          </button>
        </div>

        {/* Tab 1: Perfil */}
        {activeTab === 'perfil' && (
          <div className="barber-modal-perfil-content">
            {/* Grid de 3 Métricas Destacadas */}
            <div className="barber-modal-stats-grid">
              <div className="barber-modal-stat-card">
                <div className="barber-modal-stat-icon-wrap">
                  <CalendarCheck size={18} />
                </div>
                <div className="barber-modal-stat-data">
                  <span className="barber-modal-stat-number">1,974</span>
                  <span className="barber-modal-stat-title">Citas Realizadas</span>
                </div>
              </div>

              <div className="barber-modal-stat-card">
                <div className="barber-modal-stat-icon-wrap">
                  <Users size={18} />
                </div>
                <div className="barber-modal-stat-data">
                  <span className="barber-modal-stat-number">1,361</span>
                  <span className="barber-modal-stat-title">Clientes Satisfechos</span>
                </div>
              </div>

              <div className="barber-modal-stat-card">
                <div className="barber-modal-stat-icon-wrap">
                  <ShieldCheck size={18} />
                </div>
                <div className="barber-modal-stat-data">
                  <span className="barber-modal-stat-number">100%</span>
                  <span className="barber-modal-stat-title">Garantía Kyrios</span>
                </div>
              </div>
            </div>

            {/* Franja de Información de Ubicación y Disponibilidad */}
            <div className="barber-modal-info-strip">
              <div className="barber-modal-info-item">
                <div className="barber-modal-info-icon-box">
                  <MapPin size={16} />
                </div>
                <div className="barber-modal-info-texts">
                  <span className="barber-modal-info-label">Ubicación de Atención</span>
                  <span className="barber-modal-info-value">Atención presencial en Sede Principal</span>
                </div>
              </div>
              <div className="barber-modal-info-item">
                <div className="barber-modal-info-icon-box">
                  <Clock size={16} />
                </div>
                <div className="barber-modal-info-texts">
                  <span className="barber-modal-info-label">Horario Habitual</span>
                  <span className="barber-modal-info-value">Martes a Sábado · 8:00 AM - 7:00 PM</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Biografía y Especialidad */}
            <div className="barber-modal-bio-card">
              <div className="barber-modal-bio-header">
                <div className="barber-modal-bio-title-wrap">
                  <Award size={18} className="barber-modal-bio-gold-icon" />
                  <h4 className="barber-modal-section-title">Trayectoria & Especialidad</h4>
                </div>
                <span className="barber-modal-bio-exp-badge">+7 años exp.</span>
              </div>

              <p className="barber-modal-about">
                Maestro barbero especializado en cortes clásicos, degradados modernos de máxima
                precisión (fade), escultura y alineado de barba a navaja tradicional con ritual de
                toalla caliente y pigmentación capilar avanzada.
              </p>
            </div>

            {/* Botón de Acción Principal para ir a Servicios y Reservar */}
            <div className="barber-modal-perfil-action">
              <button
                type="button"
                className="barber-modal-cta-primary-btn"
                onClick={() => setActiveTab('servicios')}
              >
                <Scissors size={18} />
                <span>Ver Servicios y Reservar Cita</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Servicios */}
        {activeTab === 'servicios' && (
          <TabServiciosBarbero
            cargando={cargandoServicios}
            error={errorServicios}
            servicios={servicios}
            barbero={barbero}
            onReservar={onReservar}
            onClose={onClose}
          />
        )}

        {/* Tab 3: Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="barber-modal-portfolio-grid">
            <div className="barber-modal-portfolio-item">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Corte Fade" className="barber-modal-portfolio-img" />
              ) : (
                <Scissors size={24} className="text-secondary" />
              )}
            </div>
            <div className="barber-modal-portfolio-item">
              <div className="d-flex flex-column align-items-center justify-content-center text-center p-2">
                <Scissors size={20} className="text-warning mb-1" />
                <span style={{ fontSize: '0.72rem' }}>Skin Fade</span>
              </div>
            </div>
            <div className="barber-modal-portfolio-item">
              <div className="d-flex flex-column align-items-center justify-content-center text-center p-2">
                <Sparkles size={20} className="text-warning mb-1" />
                <span style={{ fontSize: '0.72rem' }}>Barba Spa</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Reseñas */}
        {activeTab === 'resenas' && (
          <div className="mb-4">
            <div className="barber-modal-review-item">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="fw-semibold">Carlos Mendoza</span>
                <span className="d-flex gap-1 barber-modal-stars">
                  {'★'.repeat(5)}
                </span>
              </div>
              <p className="mb-0 opacity-85 small">
                “Excelente atención, muy detallista con el degradado y el perfilado. 100% recomendado.”
              </p>
            </div>

            <div className="barber-modal-review-item">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="fw-semibold">Andrés Restrepo</span>
                <span className="d-flex gap-1 barber-modal-stars">
                  {'★'.repeat(5)}
                </span>
              </div>
              <p className="mb-0 opacity-85 small">
                “Puntualidad y técnica de primera. La toalla caliente en la barba es otro nivel.”
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BarberProfileModal;

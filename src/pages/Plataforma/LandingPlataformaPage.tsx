import { Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  CalendarCheck2,
  MessageSquare,
  Users,
  Store,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  BarChart3,
} from 'lucide-react';
import BrandLogo from '../../shared/ui/BrandLogo';
import './LandingPlataformaPage.css';

export default function LandingPlataformaPage() {
  return (
    <div className="saas-landing">
      <div className="saas-landing__glow-top" />
      <div className="saas-landing__glow-bottom" />
      <div className="saas-landing__grid-pattern" />

      <div className="saas-landing__container">
        {/* Navbar */}
        <header className="saas-nav">
          <div className="saas-nav__logo-wrap">
            <BrandLogo variant="white" height={32} forceKyrios showName={false} />
            <span className="saas-nav__platform-tag">SaaS Platform</span>
          </div>

          <nav className="saas-nav__links">
            <a href="#pilares" className="saas-nav__link">Características</a>
            <a href="#preview" className="saas-nav__link">Demostración</a>
            <Link to="/plataforma" className="saas-nav__link">Explorar Barberías</Link>
          </nav>

          <div className="d-flex align-items-center gap-2">
            <Link to="/plataforma" className="btn-saas-outline">
              <Layers size={16} />
              <span>Consola Hub</span>
            </Link>
            <a
              href="/barberia-demo-2"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-saas-primary d-none d-sm-inline-flex"
            >
              <span>Ver Demo en Vivo</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="saas-hero">
          <div className="saas-hero__eyebrow">
            <Sparkles size={14} className="text-warning" />
            <span>Infraestructura Multitenant de Nueva Generación</span>
          </div>

          <h1 className="saas-hero__title">
            El sistema operativo definitivo para{' '}
            <span className="saas-hero__title-gradient">barberías de alto estándar</span>
          </h1>

          <p className="saas-hero__subtitle">
            Gestiona reservas en tiempo real, automatiza avisos por WhatsApp, fideliza a tus clientes con perfiles VIP y escala tu negocio bajo un portal unificado con arquitectura multi-negocio.
          </p>

          <div className="saas-hero__actions">
            <Link to="/plataforma" className="btn-saas-primary">
              <Store size={18} />
              <span>Explorar Barberías Creadas</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="/barberia-demo-2"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-saas-outline"
            >
              <span>Probar Reserva como Cliente</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </section>

        {/* Preview Mockup Window */}
        <section id="preview" className="saas-preview">
          <div className="saas-preview__inner">
            <div className="saas-preview__window-bar">
              <div className="saas-preview__dot" />
              <div className="saas-preview__dot" />
              <div className="saas-preview__dot" />
              <div className="saas-preview__url-pill">
                https://kyrios.app/:tu-barberia/reservar
              </div>
            </div>

            <div className="saas-preview__content">
              {/* Columna Izquierda: Simulación de Citas */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill small">
                      Portal Multitenant Activo
                    </span>
                    <h3 className="h5 fw-bold text-white mt-2 mb-0">Barbería Demo 2 &middot; Sede Principal</h3>
                  </div>
                  <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                    <span className="p-1 rounded-circle bg-success d-inline-block"></span>{' '}
                    En línea
                  </span>
                </div>

                <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 small">
                      CONFIRMADA #24
                    </span>
                    <span className="text-info fw-bold">$ 45.000 COP</span>
                  </div>
                  <div className="fw-semibold text-white">Corte Fade Premium + Barboterapia</div>
                  <div className="text-secondary small mt-1">Con Barbero: Camilo Rendón &bull; 15:30 - 16:30 hrs</div>
                </div>

                <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 small">
                      WHATSAPP NOTIFIER
                    </span>
                    <span className="text-secondary small">Hace 2 min</span>
                  </div>
                  <p className="text-light small mb-0 font-monospace">
                    "Hola Mateo! Tu cita en Barbería Demo ha sido confirmada para hoy a las 15:30. ¡Te esperamos!"
                  </p>
                </div>
              </div>

              {/* Columna Derecha: Métricas en vivo */}
              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3" style={{ background: 'rgba(0, 113, 188, 0.08)', border: '1px solid rgba(0, 113, 188, 0.25)' }}>
                  <div className="d-flex align-items-center gap-2 text-info small fw-bold mb-1">
                    <BarChart3 size={16} />
                    <span>Rendimiento del Negocio</span>
                  </div>
                  <div className="h3 fw-bolder text-white mb-0">+38%</div>
                  <div className="small text-secondary">Aumento en recurrencia de turnos este mes</div>
                </div>

                <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  <div className="d-flex align-items-center gap-2 text-warning small fw-bold mb-1">
                    <ShieldCheck size={16} />
                    <span>Aislamiento Multitenant</span>
                  </div>
                  <div className="small text-secondary">
                    Cada barbería opera con su propio slug, equipo, catálogo y base de clientes protegida de forma estricta.
                  </div>
                </div>

                <Link
                  to="/plataforma"
                  className="btn btn-outline-light btn-sm text-decoration-none py-2 text-center rounded-pill fw-semibold"
                >
                  Abrir panel de administración general &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares y Características */}
        <section id="pilares" className="saas-features">
          <div className="saas-section-header">
            <h2>Diseñado para el ritmo de las mejores barberías</h2>
            <p>
              Olvídate de cuadernos de turnos o sistemas genéricos. Kyrios Platform fue creada especialmente para el rubro de la barbería y el estilismo profesional.
            </p>
          </div>

          <div className="saas-features__grid">
            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <CalendarCheck2 size={24} />
              </div>
              <h3>Agendamiento Inteligente</h3>
              <p>
                Los clientes reservan en segundos según los horarios y disponibilidad real de cada barbero, sin solapamientos ni desorden.
              </p>
            </div>

            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <MessageSquare size={24} />
              </div>
              <h3>Automatización WhatsApp</h3>
              <p>
                Notificaciones automáticas de confirmación, recordatorios y enlaces de autogestión de citas enviados al instante al teléfono del cliente.
              </p>
            </div>

            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <Layers size={24} />
              </div>
              <h3>Arquitectura Multitenant</h3>
              <p>
                Soporta múltiples barberías y sucursales en una misma plataforma. Cada negocio tiene su identidad, slug y catálogo exclusivo.
              </p>
            </div>

            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <Users size={24} />
              </div>
              <h3>Portal VIP del Cliente</h3>
              <p>
                Acceso exclusivo para que los clientes consulten su historial de citas, reprogramen turnos, guarden favoritos y acumulen puntos.
              </p>
            </div>

            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <Smartphone size={24} />
              </div>
              <h3>Experiencia Móvil de Primera</h3>
              <p>
                Diseño 100% responsivo adaptable a cualquier teléfono, tablet o computador, con soporte nativo de modo claro y oscuro.
              </p>
            </div>

            <div className="saas-feature-card">
              <div className="saas-feature-card__icon">
                <ShieldCheck size={24} />
              </div>
              <h3>Control Total de Roles</h3>
              <p>
                Permisos diferenciados para Superadmin de Plataforma, Administradores de Barbería, Barberos con su propia agenda y Clientes finales.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner Final */}
        <section className="saas-cta-banner">
          <h2>¿Listo para elevar el estándar de tu barbería?</h2>
          <p>
            Explora las barberías activas en el hub interactivo o descubre cómo opera la experiencia de reservas en vivo ahora mismo.
          </p>
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
            <Link to="/plataforma" className="btn-saas-primary">
              <Store size={18} />
              <span>Ver Hub de Barberías</span>
            </Link>
            <a
              href="/barberia-demo-2"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-saas-outline"
            >
              <span>Ver Barbería Demo</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="saas-footer">
          <div className="d-flex align-items-center gap-2">
            <BrandLogo variant="white" height={22} />
            <span>&copy; {new Date().getFullYear()} Kyrios Platform. Todos los derechos reservados.</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Link to="/plataforma" className="text-secondary text-decoration-none">Directorio Multitenant</Link>
            <a href="/barberia-demo-2" target="_blank" rel="noopener noreferrer" className="text-secondary text-decoration-none">Demo</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

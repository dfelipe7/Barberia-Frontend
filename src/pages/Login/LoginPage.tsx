import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clock,
  Layers,
  MessageSquare,
  Monitor,
  Moon,
  Scissors,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { clientesService } from '../../features/reservas/api/reservas.service';
import { mapApiError } from '../../shared/lib/mapApiError';
import { obtenerNegocioSlugActivo, RUTAS_RESERVADAS } from '../../shared/lib/http/axios';
import { resolverTemaTenant, TEMAS_TENANT } from '../../config/tenantTheme';
import BrandLogo from '../../shared/ui/BrandLogo';
import KyriosSpinner from '../../shared/ui/KyriosSpinner';
import heroImg from '../../assets/hero.png';
import { useTenantBrand } from '../../features/negocio/context/TenantBrandContext';
import '../../features/reservas/pages/AuthSplitLayout.css';

export type TipoAccesoLogin = 'cliente' | 'personal';

export interface LoginPageProps {
  modoInicial?: TipoAccesoLogin;
}

function esRutaLocalSegura(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.includes('\\');
}

export const LoginPage: React.FC<LoginPageProps> = ({ modoInicial }) => {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    loginConGoogle,
    isAuthenticated,
    isInitializing,
    esStaffDeSede,
    negocioSesionSlug,
    negocioSesionNombre,
  } = useAuth();

  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel =
    theme === 'light'
      ? 'Tema actual: Claro (clic para cambiar a Automático)'
      : theme === 'dark'
        ? 'Tema actual: Oscuro (clic para cambiar a Claro)'
        : 'Tema actual: Automático del Sistema (clic para cambiar a Oscuro)';

  const { nombreNegocio, bannerUrl } = useTenantBrand();
  const effectiveName = nombreNegocio || 'Kyrios Barber Studio';

  // Determinar tab inicial desde URL query param (?tab=personal o ?tab=cliente) o prop
  const tabParam = searchParams.get('tab') || searchParams.get('tipo');
  const resolverTabInicial = (): TipoAccesoLogin => {
    if (tabParam === 'personal' || tabParam === 'equipo' || tabParam === 'staff') {
      return 'personal';
    }
    if (tabParam === 'cliente') {
      return 'cliente';
    }
    return modoInicial || 'cliente';
  };

  const [tabActiva, setTabActiva] = useState<TipoAccesoLogin>(resolverTabInicial);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [isCargando, setIsCargando] = useState(false);

  // Sincronizar tab si cambia el search param externo sin setState en effect
  const tabActivaEfectiva = useMemo<TipoAccesoLogin>(() => {
    if (tabParam === 'personal' || tabParam === 'equipo' || tabParam === 'staff') {
      return 'personal';
    }
    if (tabParam === 'cliente') {
      return 'cliente';
    }
    return tabActiva;
  }, [tabParam, tabActiva]);

  // Manejo seguro del retorno
  const returnToState = (location.state as { returnTo?: unknown } | null)?.returnTo;
  const returnToQuery = searchParams.get('returnTo');
  const returnToCandidato = esRutaLocalSegura(returnToState)
    ? returnToState
    : esRutaLocalSegura(returnToQuery)
      ? returnToQuery
      : '';

  const slugFromReturnTo = useMemo(() => {
    if (!returnToCandidato) return null;
    const primerSeg = returnToCandidato.split('/')[1];
    return primerSeg && !RUTAS_RESERVADAS.has(primerSeg) ? primerSeg : null;
  }, [returnToCandidato]);

  const slug = paramSlug || slugFromReturnTo || obtenerNegocioSlugActivo() || '';

  // Persistir slug de ruta en localStorage si es válido
  useEffect(() => {
    if (paramSlug && !RUTAS_RESERVADAS.has(paramSlug.toLowerCase().trim())) {
      localStorage.setItem('negocio_slug', paramSlug.toLowerCase().trim());
    }
  }, [paramSlug]);

  // Estado de sesiones activas
  const esStaffDeEstaSede = esStaffDeSede(paramSlug);
  const tieneSesionEnOtraSede = isAuthenticated && !esStaffDeEstaSede && Boolean(negocioSesionSlug);
  const sesionCliente = slug ? clientesService.obtenerSesion(slug) : null;

  // Redirección si el personal ya tiene sesión activa en esta sede y está en la pestaña de personal
  useEffect(() => {
    if (!isInitializing && isAuthenticated && esStaffDeEstaSede && tabActiva === 'personal') {
      const targetSlug = paramSlug || localStorage.getItem('negocio_sesion_slug') || 'kyrios-studio';
      void navigate(`/${targetSlug}/dashboard`, { replace: true });
    }
  }, [isInitializing, isAuthenticated, esStaffDeEstaSede, paramSlug, tabActiva, navigate]);

  // Cambiar pestaña actualizando la URL de forma suave
  const handleCambiarTab = (nuevoTab: TipoAccesoLogin) => {
    setTabActiva(nuevoTab);
    setErrorMensaje(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', nuevoTab);
        return next;
      },
      { replace: true }
    );
  };

  // ── Autenticación de Cliente ──
  const handleGoogleClienteSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) {
      setErrorMensaje('No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.');
      return;
    }

    setIsCargando(true);
    setErrorMensaje(null);

    try {
      const sesion = await clientesService.iniciarSesionGoogle(cred.credential, slug);
      clientesService.guardarSesion(sesion, slug);
      const destino = returnToCandidato || (slug ? `/${slug}/cliente/mi-cuenta` : '/cliente/mi-cuenta');
      void navigate(destino, { replace: true, state: { desdeLogin: true } });
    } catch (err: unknown) {
      setErrorMensaje(mapApiError(err));
    } finally {
      setIsCargando(false);
    }
  };

  // ── Autenticación de Personal ──
  const handleGoogleStaffSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse?.credential) {
      setErrorMensaje('No se recibió la credencial de autenticación de Google.');
      return;
    }

    setIsCargando(true);
    setErrorMensaje(null);

    const resultado = await loginConGoogle(credentialResponse.credential);
    setIsCargando(false);

    if (resultado.success) {
      const targetSlug = slug || localStorage.getItem('negocio_sesion_slug') || 'kyrios-studio';
      void navigate(`/${targetSlug}/dashboard`, { replace: true });
    } else {
      let texto = 'Acceso denegado: Tu correo no se encuentra registrado en el personal autorizado de la barbería.';
      if (typeof resultado.error === 'string') {
        texto = resultado.error;
      } else if (typeof resultado.error === 'object' && resultado.error !== null) {
        const errObj = resultado.error as Record<string, unknown>;
        const msg =
          typeof errObj.message === 'string'
            ? errObj.message
            : typeof errObj.error === 'string'
              ? errObj.error
              : null;
        if (msg) texto = msg;
      }
      setErrorMensaje(String(texto));
    }
  };

  const handleGoogleError = () => {
    setErrorMensaje('Ocurrió un error al conectar con Google. Por favor intenta de nuevo.');
  };

  // Beneficios dinámicos según pestaña
  const perksCliente = [
    {
      icon: <CalendarCheck size={18} />,
      title: 'Tus citas siempre organizadas',
      desc: 'Consulta próximos turnos, reprograma o cancela en segundos desde un solo lugar.',
    },
    {
      icon: <MessageSquare size={18} />,
      title: 'Notificaciones a tu WhatsApp',
      desc: 'Recibe confirmaciones automáticas y recordatorios antes de que empiece tu cita.',
    },
    {
      icon: <Clock size={18} />,
      title: 'Reserva sin contraseñas',
      desc: 'Accede con un clic usando tu cuenta de Google. Sin recordar claves complejas.',
    },
  ];

  const perksStaff = [
    {
      icon: <Calendar size={18} />,
      title: 'Control total de agenda',
      desc: 'Visualiza tus turnos diarios y semanales con actualizaciones en tiempo real.',
    },
    {
      icon: <Layers size={18} />,
      title: 'Estados de cita y recepción',
      desc: 'Gestiona la llegada del cliente, citas en progreso o finalizadas con un toque.',
    },
    {
      icon: <TrendingUp size={18} />,
      title: 'Métricas y rendimiento',
      desc: 'Consulta tus servicios realizados, clientes atendidos y facturación del negocio.',
    },
  ];

  const esModoCliente = tabActivaEfectiva === 'cliente';
  const temaId = resolverTemaTenant(slug);
  const temaConfig = TEMAS_TENANT[temaId] || TEMAS_TENANT['clasico-azul'];

  return (
    <div
      className={`auth-split auth-split--tenant ${esModoCliente ? 'auth-split--cliente' : 'auth-split--staff'}`}
      data-tenant-theme={temaId}
      style={
        {
          '--tenant-accent': temaConfig.colorPrimario,
          '--tenant-glow': temaConfig.glow,
          '--tenant-btn-text': temaConfig.colorTextoBoton,
        } as React.CSSProperties
      }
    >
      {/* ── PANEL IZQUIERDO: MARCA Y BENEFICIOS VIP ── */}
      <aside className="auth-split__brand-panel" aria-label="Portal de acceso">
        <div
          className="auth-split__brand-bg"
          style={{ backgroundImage: `url(${bannerUrl || heroImg})` }}
          aria-hidden="true"
        />
        <div className="auth-split__brand-overlay" aria-hidden="true" />
        <div className="auth-split__brand-glow" aria-hidden="true" />

        <div className="auth-split__brand-content">
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <BrandLogo variant="white" height={40} alt={effectiveName} />
            </div>

            <div className="mb-4">
              <span className="auth-split__brand-badge">
                {esModoCliente ? (
                  <>
                    <Sparkles size={13} /> Experiencia de Cliente VIP
                  </>
                ) : (
                  <>
                    <Scissors size={13} /> Sistema de Gestión Profesional
                  </>
                )}
              </span>
            </div>

            <h1 className="auth-split__brand-title">
              {esModoCliente ? (
                <>
                  Tu corte y estilo, <br />
                  gestionados sin complicaciones.
                </>
              ) : (
                <>
                  La plataforma operativa de <br />
                  tu estudio de barbería.
                </>
              )}
            </h1>

            <p className="auth-split__brand-subtitle">
              {esModoCliente
                ? 'Disfruta de una atención personalizada en cada visita. Gestiona tus reservas con facilidad y sin perder tus enlaces.'
                : 'Herramienta exclusiva para superadministradores, gerentes y barberos del equipo. Administra tu flujo de trabajo diario.'}
            </p>

            <div className="auth-split__perks">
              {(esModoCliente ? perksCliente : perksStaff).map((perk, i) => (
                <div key={`perk-${perk.title}-${i}`} className="auth-split__perk-item">
                  <div className="auth-split__perk-icon">{perk.icon}</div>
                  <div className="auth-split__perk-text">
                    <strong>{perk.title}</strong>
                    <span>{perk.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-split__brand-footer">
            <span>
              {esModoCliente
                ? `© ${new Date().getFullYear()} ${effectiveName}. Todos los derechos reservados.`
                : 'Kyrios OS Enterprise · Infraestructura Multitenant Segura'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── PANEL DERECHO: FORMULARIO UNIFICADO CON PESTAÑAS ── */}
      <main className="auth-split__form-panel">
        <div className="auth-split__form-box">
          <div className="auth-split__top-bar">
            <Link to={slug ? `/${slug}` : '/'} className="auth-split__top-link">
              <ArrowLeft size={16} /> Volver a la barbería
            </Link>
            <button
              type="button"
              className="auth-split__theme-btn"
              onClick={cycleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              <ThemeIcon size={16} />
            </button>
          </div>

          <div className="auth-split__mobile-brand">
            <BrandLogo variant={isDark ? 'white' : 'black'} height={34} alt={effectiveName} />
          </div>

          {/* ── SELECTOR SEGMENTADO DE ROL (PESTAÑAS) ── */}
          <div className="auth-split__tabs" role="tablist" aria-label="Tipo de usuario">
            <button
              type="button"
              role="tab"
              aria-selected={esModoCliente}
              className={`auth-split__tab-btn ${esModoCliente ? 'is-active' : ''}`}
              onClick={() => handleCambiarTab('cliente')}
            >
              <User size={16} />
              <span>Soy Cliente</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!esModoCliente}
              className={`auth-split__tab-btn ${!esModoCliente ? 'is-active' : ''}`}
              onClick={() => handleCambiarTab('personal')}
            >
              <Scissors size={16} />
              <span>Equipo / Barbería</span>
            </button>
          </div>

          <div className="auth-split__header">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="auth-split__brand-badge">
                {esModoCliente ? (
                  <>
                    <UserCheck size={13} /> Portal de Clientes
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} /> Acceso al Equipo y Barberos
                  </>
                )}
              </span>
            </div>
            <h2 className="auth-split__heading">
              {esModoCliente ? 'Bienvenido a tus Reservas' : 'Panel Administrativo'}
            </h2>
            <p className="auth-split__desc">
              {esModoCliente
                ? 'Inicia sesión con Google para administrar tus citas, reprogramar turnos o actualizar tu perfil.'
                : 'Inicia sesión con tu cuenta corporativa o correo autorizado para gestionar la barbería.'}
            </p>
          </div>

          {/* Avisos de sesión activa previa */}
          {tieneSesionEnOtraSede && !esModoCliente && (
            <div
              className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-2"
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '0.84rem',
              }}
            >
              <div className="d-flex align-items-center gap-2" style={{ color: '#60a5fa' }}>
                <ShieldCheck size={16} />
                <span>
                  Sesión activa en <strong>{negocioSesionNombre || negocioSesionSlug}</strong>
                </span>
              </div>
              <Link
                to={slug ? `/${slug}/dashboard` : '/dashboard'}
                className="btn btn-sm btn-primary py-0 px-2"
                style={{ fontSize: '0.78rem' }}
              >
                Ir a mi panel
              </Link>
            </div>
          )}

          {sesionCliente && esModoCliente && (
            <div
              className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-2"
              style={{
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontSize: '0.84rem',
              }}
            >
              <div className="d-flex align-items-center gap-2" style={{ color: '#facc15' }}>
                <UserCheck size={16} />
                <span>
                  Sesión activa: <strong>{sesionCliente.nombre}</strong>
                </span>
              </div>
              <Link
                to={slug ? `/${slug}/cliente/mi-cuenta` : '/cliente/mi-cuenta'}
                className="btn btn-sm btn-warning py-0 px-2 text-dark fw-semibold"
                style={{ fontSize: '0.78rem' }}
              >
                Mis Citas
              </Link>
            </div>
          )}

          {errorMensaje && (
            <div
              className="alert d-flex align-items-start gap-2 py-2.5 px-3 mb-4 rounded-3 small"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
              }}
              role="alert"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div>{errorMensaje}</div>
            </div>
          )}

          {/* Tarjeta de Inicio de Sesión de Google */}
          <div className="auth-split__action-card">
            {isCargando ? (
              <div className="py-4 text-center">
                <KyriosSpinner
                  size="md"
                  mensaje={
                    esModoCliente
                      ? 'Verificando cuenta con Google...'
                      : 'Verificando permisos de personal...'
                  }
                />
              </div>
            ) : (
              <div className="auth-split__google-wrap">
                <GoogleLogin
                  onSuccess={(cred) => {
                    if (esModoCliente) {
                      void handleGoogleClienteSuccess(cred);
                    } else {
                      void handleGoogleStaffSuccess(cred);
                    }
                  }}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme={isDark ? 'filled_black' : 'outline'}
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}

            <div className="auth-split__security-note">
              <ShieldCheck
                size={14}
                className={esModoCliente ? 'text-success' : 'text-info'}
              />
              <span>
                {esModoCliente
                  ? 'Autenticación oficial y cifrada con Google OAuth 2.0'
                  : 'Acceso restringido · Validación RBAC por roles'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

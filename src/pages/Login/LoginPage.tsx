import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { obtenerNegocioSlugActivo, RUTAS_RESERVADAS } from '../../shared/lib/http/axios';
import { GoogleLogin } from '@react-oauth/google';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Layers,
  Scissors,
  ShieldCheck,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { clientesService } from '../../features/reservas/api/reservas.service';
import BrandLogo from '../../shared/ui/BrandLogo';
import KyriosSpinner from '../../shared/ui/KyriosSpinner';
import heroImg from '../../assets/hero.png';
import '../../features/reservas/pages/AuthSplitLayout.css';

export const LoginPage: React.FC = () => {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slug = paramSlug || obtenerNegocioSlugActivo() || '';
  const navigate = useNavigate();
  const { loginConGoogle, isAuthenticated, isInitializing, esStaffDeSede, negocioSesionSlug, negocioSesionNombre } = useAuth();
  const esStaffDeEstaSede = esStaffDeSede(paramSlug);
  const tieneSesionEnOtraSede = isAuthenticated && !esStaffDeEstaSede && Boolean(negocioSesionSlug);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [isCargando, setIsCargando] = useState(false);
  const sesionCliente = slug ? clientesService.obtenerSesion(slug) : null;

  useEffect(() => {
    if (paramSlug && !RUTAS_RESERVADAS.has(paramSlug.toLowerCase().trim())) {
      localStorage.setItem('negocio_slug', paramSlug.toLowerCase().trim());
    }
  }, [paramSlug]);

  useEffect(() => {
    if (!isInitializing && isAuthenticated && esStaffDeEstaSede) {
      const targetSlug = paramSlug || localStorage.getItem('negocio_sesion_slug') || 'kyrios-studio';
      navigate(`/${targetSlug}/dashboard`, { replace: true });
    }
  }, [isInitializing, isAuthenticated, esStaffDeEstaSede, paramSlug, navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
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
      navigate(`/${targetSlug}/dashboard`, { replace: true });
    } else {
      let texto = 'Acceso denegado: Tu correo no se encuentra registrado en el personal autorizado de la barbería.';
      if (typeof resultado.error === 'string') {
        texto = resultado.error;
      } else if (typeof resultado.error === 'object' && resultado.error !== null) {
        texto = (resultado.error as any).message || (resultado.error as any).error || texto;
      }
      setErrorMensaje(String(texto));
    }
  };

  const handleGoogleError = () => {
    setErrorMensaje('Ocurrió un error al conectar con Google. Por favor intenta de nuevo.');
  };

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

  return (
    <div className="auth-split auth-split--staff">
      {/* ── PANEL IZQUIERDO: MARCA Y HERRAMIENTAS DEL EQUIPO ── */}
      <aside className="auth-split__brand-panel" aria-label="Portal administrativo">
        <div
          className="auth-split__brand-bg"
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-hidden="true"
        />
        <div className="auth-split__brand-overlay" aria-hidden="true" />
        <div className="auth-split__brand-glow" aria-hidden="true" />

        <div className="auth-split__brand-content">
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <BrandLogo variant="white" height={40} alt="Kyrios Barber Studio" />
            </div>

            <div className="mb-4">
              <span className="auth-split__brand-badge">
                <Scissors size={13} /> Sistema de Gestión Profesional
              </span>
            </div>

            <h1 className="auth-split__brand-title">
              La plataforma operativa de <br />
              tu estudio de barbería.
            </h1>
            <p className="auth-split__brand-subtitle">
              Herramienta exclusiva para superadministradores, gerentes y barberos del equipo. Administra tu flujo de trabajo diario sin fricciones.
            </p>

            <div className="auth-split__perks">
              {perksStaff.map((perk, i) => (
                <div key={i} className="auth-split__perk-item">
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
            <span>Kyrios OS Enterprise · Infraestructura Multitenant Segura</span>
          </div>
        </div>
      </aside>

      {/* ── PANEL DERECHO: ACCESO DE PERSONAL ── */}
      <main className="auth-split__form-panel">
        <div className="auth-split__form-box">
          <Link to={slug ? `/${slug}` : '/'} className="auth-split__top-link">
            <ArrowLeft size={16} /> Volver al sitio principal
          </Link>

          <div className="auth-split__mobile-brand">
            <BrandLogo variant="white" height={34} alt="Kyrios Barber Studio" />
          </div>

          <div className="auth-split__header">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="auth-split__brand-badge">
                <ShieldCheck size={13} /> Acceso al Equipo y Barberos
              </span>
            </div>
            <h2 className="auth-split__heading">
              Panel Administrativo
            </h2>
            <p className="auth-split__desc">
              Inicia sesión con tu correo institucional o personal autorizado para acceder a tu panel de control.
            </p>
          </div>

                    {tieneSesionEnOtraSede && (
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
              <Link to={slug ? `/${slug}/dashboard` : '/dashboard'} className="btn btn-sm btn-primary py-0 px-2" style={{ fontSize: '0.78rem' }}>
                Ir a mi panel
              </Link>
            </div>
          )}
          {sesionCliente && (
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
                <span>Sesión activa como <strong>Cliente</strong></span>
              </div>
              <Link to={slug ? `/${slug}/cliente/mi-cuenta` : '/cliente/mi-cuenta'} className="btn btn-sm btn-warning py-0 px-2" style={{ fontSize: '0.78rem' }}>
                Ir a Mi Cuenta
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
                <KyriosSpinner size="md" mensaje="Verificando permisos de personal..." />
              </div>
            ) : (
              <div className="auth-split__google-wrap">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}

            <div className="auth-split__security-note">
              <ShieldCheck size={14} className="text-info" />
              <span>Acceso restringido · Validación RBAC por roles</span>
            </div>
          </div>

          {/* Enlace alterno cruzado a Clientes */}
          <div className="auth-split__cross-access">
            <p>¿Eres un cliente buscando ver o agendar tus citas?</p>
            <Link
              to={slug ? `/${slug}/cliente/iniciar-sesion` : '/cliente/iniciar-sesion'}
              className="auth-split__cross-link"
            >
              Iniciar sesión como Cliente VIP →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

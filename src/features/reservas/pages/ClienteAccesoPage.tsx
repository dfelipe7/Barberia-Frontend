import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { clientesService } from '../api/reservas.service';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import BrandLogo from '../../../shared/ui/BrandLogo';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import heroImg from '../../../assets/hero.png';
import './AuthSplitLayout.css';

type ModoAccesoCliente = 'registro' | 'iniciar-sesion';

function esRutaLocalSegura(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.includes('\\');
}

export default function ClienteAccesoPage({ modo }: { modo: ModoAccesoCliente }) {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slug = paramSlug || obtenerNegocioSlugActivo() || '';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const registro = modo === 'registro';

  const returnToState = (location.state as { returnTo?: unknown } | null)?.returnTo;
  const returnToQuery = searchParams.get('returnTo');
  const returnTo = esRutaLocalSegura(returnToState)
    ? returnToState
    : esRutaLocalSegura(returnToQuery)
      ? returnToQuery
      : slug ? `/${slug}/cliente/mi-cuenta` : '/cliente/mi-cuenta';

  const iniciarSesion = async (respuesta: CredentialResponse) => {
    if (!respuesta.credential) {
      setError('No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.');
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const sesion = await clientesService.iniciarSesionGoogle(respuesta.credential);
      clientesService.guardarSesion(sesion);
      navigate(returnTo, { replace: true, state: { desdeLogin: true } });
    } catch (errorDesconocido: unknown) {
      setError(mapApiError(errorDesconocido));
    } finally {
      setCargando(false);
    }
  };

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

  return (
    <div className="auth-split auth-split--cliente">
      {/* ── PANEL IZQUIERDO: MARCA Y BENEFICIOS VIP ── */}
      <aside className="auth-split__brand-panel" aria-label="Información de la membresía">
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
                <Sparkles size={13} /> Experiencia de Cliente VIP
              </span>
            </div>

            <h1 className="auth-split__brand-title">
              Tu corte y estilo, <br />
              gestionados sin complicaciones.
            </h1>
            <p className="auth-split__brand-subtitle">
              Disfruta de una atención personalizada en cada visita. Gestiona tus reservas con facilidad y sin perder tus enlaces.
            </p>

            <div className="auth-split__perks">
              {perksCliente.map((perk, i) => (
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
            <span>© {new Date().getFullYear()} Kyrios Barber Studio. Todos los derechos reservados.</span>
          </div>
        </div>
      </aside>

      {/* ── PANEL DERECHO: FORMULARIO Y ACCESO GOOGLE ── */}
      <main className="auth-split__form-panel">
        <div className="auth-split__form-box">
          <Link to={returnTo} className="auth-split__top-link">
            <ArrowLeft size={16} /> Volver a la barbería
          </Link>

          <div className="auth-split__mobile-brand">
            <BrandLogo variant="white" height={34} alt="Kyrios Barber Studio" />
          </div>

          <div className="auth-split__header">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="auth-split__brand-badge">
                {registro ? <UserRoundPlus size={13} /> : <LogIn size={13} />}
                Portal de Clientes
              </span>
            </div>
            <h2 className="auth-split__heading">
              {registro ? 'Crea tu cuenta de cliente' : 'Bienvenido de nuevo'}
            </h2>
            <p className="auth-split__desc">
              {registro
                ? 'Conéctate con Google para sincronizar tus reservas y recibir avisos por WhatsApp.'
                : 'Inicia sesión con Google para administrar tus citas y perfil.'}
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          {/* Tarjeta de Inicio de Sesión de Google */}
          <div className="auth-split__action-card">
            {cargando ? (
              <div className="py-4 text-center">
                <KyriosSpinner size="md" mensaje="Verificando cuenta con Google..." />
              </div>
            ) : (
              <div className="auth-split__google-wrap">
                <GoogleLogin
                  onSuccess={(credencial) => void iniciarSesion(credencial)}
                  onError={() => setError('No fue posible conectar con Google. Inténtalo de nuevo.')}
                  useOneTap={false}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text={registro ? 'signup_with' : 'continue_with'}
                />
              </div>
            )}

            <div className="auth-split__security-note">
              <ShieldCheck size={14} className="text-success" />
              <span>Autenticación oficial y cifrada con Google OAuth 2.0</span>
            </div>
          </div>

          {/* Enlace alterno cruzado a Personal / Barberos */}
          <div className="auth-split__cross-access">
            <p>¿Eres barbero o administras este negocio?</p>
            <Link
              to={slug ? `/${slug}/login` : '/login'}
              className="auth-split__cross-link"
            >
              Acceder al Panel de Personal y Barberos →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

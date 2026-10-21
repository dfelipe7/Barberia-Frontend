import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ArrowLeft, LogIn, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { clientesService } from '../api/reservas.service';
import { mapApiError } from '../../../shared/lib/mapApiError';
import BrandLogo from '../../../shared/ui/BrandLogo';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import './ClienteAccesoPage.css';

type ModoAccesoCliente = 'registro' | 'iniciar-sesion';

function esRutaLocalSegura(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.includes('\\');
}

export default function ClienteAccesoPage({ modo }: { modo: ModoAccesoCliente }) {
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
      : '/reservar';

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
      navigate(returnTo, { replace: true });
    } catch (errorDesconocido: unknown) {
      setError(mapApiError(errorDesconocido));
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="client-access">
      <div className="client-access__glow" aria-hidden="true" />
      <section className="client-access__card card card-surface">
        <Link to={returnTo} className="client-access__back">
          <ArrowLeft size={16} aria-hidden="true" /> Volver a la reserva
        </Link>

        <div className="client-access__brand">
          <BrandLogo variant="white" height={42} alt="Kyrios Studio" />
          <span className="client-access__eyebrow">PORTAL DE CLIENTES</span>
        </div>

        <span className="client-access__icon" aria-hidden="true">
          {registro ? <UserRoundPlus size={24} /> : <LogIn size={24} />}
        </span>
        <h1>{registro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
        <p className="client-access__description">
          {registro
            ? 'Regístrate con Google para guardar y consultar tus próximas citas desde aquí.'
            : 'Inicia sesión con Google para consultar y administrar tus citas.'}
        </p>

        {registro && (
          <p className="client-access__note">
            Tu cuenta se crea al continuar con Google. No necesitas crear una contraseña.
          </p>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="client-access__google">
          {cargando ? (
            <KyriosSpinner size="md" mensaje="Conectando tu cuenta..." />
          ) : (
            <GoogleLogin
              onSuccess={(credencial) => void iniciarSesion(credencial)}
              onError={() => setError('No fue posible conectar con Google. Inténtalo de nuevo.')}
              useOneTap={false}
              theme="outline"
              shape="pill"
              size="large"
              text={registro ? 'signup_with' : 'continue_with'}
            />
          )}
        </div>

        <div className="client-access__security">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Acceso seguro con Google</span>
        </div>

        <div className="client-access__switch">
          {registro ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <Link to={'/cliente/iniciar-sesion?returnTo=' + encodeURIComponent(returnTo)} state={{ returnTo }}>Inicia sesión</Link>
            </>
          ) : (
            <>
              ¿Es tu primera vez?{' '}
              <Link to={'/cliente/registro?returnTo=' + encodeURIComponent(returnTo)} state={{ returnTo }}>Crear cuenta</Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

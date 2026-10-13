import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import BrandLogo from '../../shared/ui/BrandLogo';
import KyriosSpinner from '../../shared/ui/KyriosSpinner';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginConGoogle, isAuthenticated, isInitializing } = useAuth();
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [isCargando, setIsCargando] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitializing, isAuthenticated, navigate]);

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
      navigate('/dashboard', { replace: true });
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

  return (
    <div className="kyrios-login-container">
      {/* Luces y texturas ambientales de la marca */}
      <div className="kyrios-login-glow-top" aria-hidden="true" />
      <div className="kyrios-login-glow-bottom" aria-hidden="true" />
      <div className="kyrios-login-grid" aria-hidden="true" />

      {/* Tarjeta de Inicio de Sesión de Alta Gama */}
      <div className="kyrios-login-card">
        {/* Cabecera de la marca */}
        <div className="text-center mb-4">
          <div className="mb-3 d-inline-block">
            <BrandLogo variant="white" height={44} alt="Kyrios Studio" />
          </div>

          <div className="d-flex justify-content-center mb-2">
            <span className="kyrios-login-badge">
              <span className="kyrios-login-badge-dot" />
              Portal de Personal
            </span>
          </div>

          <p className="text-secondary small mb-0 mt-2" style={{ color: '#94a3b8' }}>
            Barbería de alto estándar · Popayán
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMensaje && (
          <div
            className="alert d-flex align-items-start gap-2 py-2 px-3 mb-4 rounded-3 small"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
            }}
            role="alert"
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-1" style={{ color: '#ef4444' }} />
            <div className="flex-grow-1">{errorMensaje}</div>
          </div>
        )}

        {/* Botón de Autenticación con Google */}
        <div className="text-center py-2 mb-3">
          {isCargando ? (
            <div className="py-3">
              <KyriosSpinner size="md" mensaje="Verificando credenciales..." />
            </div>
          ) : (
            <div className="d-flex justify-content-center">
              <div className="kyrios-google-btn-wrapper">
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
            </div>
          )}
        </div>

        {/* Insignia de Seguridad */}
        <div className="text-center mb-4">
          <span className="kyrios-security-pill">
            <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
            Autenticación segura con Google OAuth 2.0
          </span>
        </div>

        {/* Pie de la tarjeta */}
        <div
          className="pt-3 border-top text-center"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <p className="small mb-3" style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Acceso exclusivo para Superadministradores, Administradores y Barberos registrados.
          </p>
          <Link to="/" className="kyrios-login-back-btn">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../../shared/ui/BrandLogo';
import { BRAND } from '../../../config/brand';
import { MenuIcon, CloseIcon } from './HomeIcons';

interface HomeNavbarProps {
  isAuthenticated: boolean;
  nombre?: string | null;
  onLogin: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  isAuthenticated,
  nombre,
  onLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="kyrios-nav">
      <div className="container py-2 d-flex align-items-center justify-content-between">
        {/* Logo de Kyrios */}
        <a
          href="#inicio"
          className="d-flex align-items-center gap-2 text-decoration-none"
          onClick={closeMobileMenu}
          aria-label="Ir al inicio de Kyrios Studio"
        >
          <BrandLogo variant="white" height={36} alt={BRAND.name} />
        </a>

        {/* Navegación Desktop */}
        <nav className="d-none d-lg-flex align-items-center gap-1" aria-label="Navegación principal">
          <a href="#inicio" className="kyrios-nav-link">
            Inicio
          </a>
          <a href="#servicios" className="kyrios-nav-link">
            Servicios
          </a>
          <a href="#barberos" className="kyrios-nav-link">
            Barberos
          </a>
          <a href="#ubicacion" className="kyrios-nav-link">
            Ubicación
          </a>
        </nav>

        {/* Acciones de Autenticación Desktop */}
        <div className="d-none d-lg-flex align-items-center gap-3">
          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3">
              <span className="text-white-50 small">
                Hola, <strong className="text-white">{nombre || 'Usuario'}</strong>
              </span>
              <button
                type="button"
                className="btn-kyrios-primary"
                onClick={() => navigate('/dashboard')}
              >
                Ir a mi panel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-kyrios-outline"
              onClick={onLogin}
            >
              Iniciar sesión
            </button>
          )}
        </div>

        {/* Botón Hamburguesa Móvil */}
        <div className="d-flex d-lg-none align-items-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn-kyrios-primary py-2 px-3 small"
              onClick={() => navigate('/dashboard')}
              style={{ fontSize: '0.75rem' }}
            >
              Panel
            </button>
          ) : (
            <button
              type="button"
              className="btn-kyrios-outline py-2 px-3 small"
              onClick={onLogin}
              style={{ fontSize: '0.75rem' }}
            >
              Ingresar
            </button>
          )}

          <button
            type="button"
            className="btn text-white p-2 border-0"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          >
            {mobileMenuOpen ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="kyrios-nav-collapse d-lg-none py-3">
          <div className="container d-flex flex-column gap-2">
            <a
              href="#inicio"
              className="kyrios-nav-link py-2 border-bottom border-dark"
              onClick={closeMobileMenu}
            >
              Inicio
            </a>
            <a
              href="#servicios"
              className="kyrios-nav-link py-2 border-bottom border-dark"
              onClick={closeMobileMenu}
            >
              Servicios
            </a>
            <a
              href="#barberos"
              className="kyrios-nav-link py-2 border-bottom border-dark"
              onClick={closeMobileMenu}
            >
              Barberos
            </a>
            <a
              href="#ubicacion"
              className="kyrios-nav-link py-2"
              onClick={closeMobileMenu}
            >
              Ubicación
            </a>

            <div className="pt-3 mt-2 border-top border-dark d-flex flex-column gap-2">
              {isAuthenticated ? (
                <>
                  <div className="text-white-50 small mb-1">
                    Conectado como <strong className="text-white">{nombre}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn-kyrios-primary w-100"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/dashboard');
                    }}
                  >
                    Ir a mi panel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-kyrios-primary w-100"
                  onClick={() => {
                    closeMobileMenu();
                    onLogin();
                  }}
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;

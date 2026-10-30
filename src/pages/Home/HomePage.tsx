import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { esRolApp } from '../../shared/lib/autorizacion/roles';
import type { Servicio } from '../../features/servicios/types/servicios.types';
import type { BarberoCatalogo } from '../../features/barberos/types/barberos.types';

import './home.css';
import HomeNavbar from './components/HomeNavbar';
import HeroSection from './components/HeroSection';
import TrustSection from './components/TrustSection';
import VisionSection from './components/VisionSection';
import ServicesSection from './components/ServicesSection';
import BarbersSection from './components/BarbersSection';
import LocationSection from './components/LocationSection';
import HomeFooter from './components/HomeFooter';

export const HomePage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const basePrefix = slug ? `/${slug}` : '';

  const { isAuthenticated, isInitializing, nombre, roles, usuarioDb } = useAuth();
  const navigate = useNavigate();

  const tienePermiso = roles.some((r) => esRolApp(r));

  useEffect(() => {
    if (isInitializing) return;
    // Si inicia sesión pero no posee ningún rol en la aplicación o está bloqueado globalmente, redirigir a "Sin Acceso"
    if (isAuthenticated && (!tienePermiso || usuarioDb?.estado === 'INACTIVO')) {
      navigate('/sin-acceso');
    }
  }, [isInitializing, isAuthenticated, tienePermiso, usuarioDb, navigate]);

  const handleReservarGeneral = () => navigate(`${basePrefix}/reservar`);

  const handleReservarServicio = (servicio: Servicio) =>
    navigate(`${basePrefix}/reservar`, { state: { servicioId: servicio.id, origen: 'servicio' } });

  const handleReservarBarbero = (barbero: BarberoCatalogo, servicioId?: number) =>
    navigate(`${basePrefix}/reservar`, {
      state: {
        barberoId: barbero.id,
        origen: 'barbero',
        ...(servicioId ? { servicioId, paso: 3 } : {}),
      },
    });

  return (
    <div className="kyrios-home min-vh-100 d-flex flex-column">
      {/* ── Navbar público con marca y estado de sesión ── */}
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={() => navigate(`${basePrefix}/login`)}
      />

      {/* ── Contenido público principal ── */}
      <main className="flex-grow-1 position-relative">
        {/* Hero visual con banner y CTAs */}
        <HeroSection onReservar={handleReservarGeneral} />

        {/* Bloque de confianza con atributos de calidad no cuantitativos */}
        <TrustSection />

        {/* Sección narrativa de visión y filosofía con layout editorial */}
        <VisionSection />

        {/* Sección de servicios reales conectados a GET /servicios */}
        <ServicesSection onReservarServicio={handleReservarServicio} />

        {/* Sección de equipo de barberos reales conectados a GET /usuarios/barberos */}
        <BarbersSection onReservarBarbero={handleReservarBarbero} />

        {/* Ubicación oficial en Popayán y cómo llegar */}
        <LocationSection />
      </main>

      {/* ── Footer institucional completo con redes sociales vectoriales ── */}
      <HomeFooter />
    </div>
  );
};

export default HomePage;

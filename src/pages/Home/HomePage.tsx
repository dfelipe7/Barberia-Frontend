import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleReservarGeneral = () => navigate('/reservar');

  const handleReservarServicio = (servicio: Servicio) =>
    navigate('/reservar', { state: { servicioId: servicio.id } });

  const handleReservarBarbero = (barbero: BarberoCatalogo) =>
    navigate('/reservar', { state: { barberoId: barbero.id } });

  return (
    <div className="kyrios-home min-vh-100 d-flex flex-column">
      {/* ── Navbar público con marca Kyrios Studio y estado de sesión ── */}
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={() => navigate('/login')}
      />

      {/* ── Contenido público principal ── */}
      <main className="flex-grow-1 position-relative">
        {/* Hero visual con banner oficial de Kyrios y CTAs */}
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

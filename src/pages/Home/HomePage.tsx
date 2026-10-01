import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { esRolApp } from '../../shared/lib/autorizacion/roles';
import type { Servicio } from '../../features/servicios/types/servicios.types';
import type { BarberoCatalogo } from '../../features/barberos/types/barberos.types';

import './home.css';
import HomeNavbar from './components/HomeNavbar';
import HeroSection from './components/HeroSection';
import TrustSection from './components/TrustSection';
import ServicesSection from './components/ServicesSection';
import BarbersSection from './components/BarbersSection';
import LocationSection from './components/LocationSection';
import HomeFooter from './components/HomeFooter';

export const HomePage: React.FC = () => {
  const { keycloak, isAuthenticated, nombre, roles } = useAuth();
  const navigate = useNavigate();

  const tienePermiso = roles.some((r) => esRolApp(r));

  useEffect(() => {
    // Si inicia sesión pero no posee ningún rol en la aplicación, redirigir a "Sin Acceso"
    if (isAuthenticated && !tienePermiso) {
      navigate('/sin-acceso');
    }
  }, [isAuthenticated, tienePermiso, navigate]);

  // Manejo de la acción de reserva respetando el estado actual de la app (sin inventar endpoints)
  const handleReservarGeneral = useCallback(() => {
    if (!isAuthenticated) {
      keycloak.login();
    } else {
      // Como el módulo de reservas backend está en desarrollo, redirigir al panel o notificar al usuario
      alert(
        '¡Hola! El sistema de reservas en línea automatizado estará habilitado muy pronto. Puedes consultar los servicios y comunicarte con nuestra sede.'
      );
    }
  }, [isAuthenticated, keycloak]);

  const handleReservarServicio = useCallback(
    (servicio: Servicio) => {
      if (!isAuthenticated) {
        keycloak.login();
      } else {
        alert(
          `Has seleccionado "${servicio.nombre}". Las reservas en línea estarán habilitadas pronto. Te esperamos en nuestra sede de Popayán.`
        );
      }
    },
    [isAuthenticated, keycloak]
  );

  const handleReservarBarbero = useCallback(
    (barbero: BarberoCatalogo) => {
      if (!isAuthenticated) {
        keycloak.login();
      } else {
        const nombreBarbero = `${barbero.nombre} ${barbero.apellido}`.trim();
        alert(
          `Deseas agendar con ${nombreBarbero}. Las reservas directas por barbero estarán disponibles muy pronto.`
        );
      }
    },
    [isAuthenticated, keycloak]
  );

  return (
    <div className="kyrios-home min-vh-100 d-flex flex-column">
      {/* ── Navbar público con marca Kyrios Studio y estado Keycloak ── */}
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={() => keycloak.login()}
      />

      {/* ── Contenido público principal ── */}
      <main className="flex-grow-1">
        {/* Hero visual con banner oficial de Kyrios y CTAs */}
        <HeroSection onReservar={handleReservarGeneral} />

        {/* Bloque de confianza con atributos de calidad no cuantitativos */}
        <TrustSection />

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

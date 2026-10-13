import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import ReservaEnProcesoAlert from './components/ReservaEnProcesoAlert';

export const HomePage: React.FC = () => {
  const { isAuthenticated, isInitializing, nombre, roles, usuarioDb } = useAuth();
  const navigate = useNavigate();

  const tienePermiso = roles.some((r) => esRolApp(r));

  // Referencia al contenedor de notificación para redirigir/desplazar la vista
  const notificacionRef = useRef<HTMLDivElement>(null);

  // Estado para advertencia visual no bloqueante de reserva en proceso
  const [reservaEnProceso, setReservaEnProceso] = useState<{
    servicio?: string;
    barbero?: string;
  } | null>(null);

  useEffect(() => {
    if (isInitializing) return;
    // Si inicia sesión pero no posee ningún rol en la aplicación o está bloqueado globalmente, redirigir a "Sin Acceso"
    if (isAuthenticated && (!tienePermiso || usuarioDb?.estado === 'INACTIVO')) {
      navigate('/sin-acceso');
    }
  }, [isInitializing, isAuthenticated, tienePermiso, usuarioDb, navigate]);

  // Desplaza suavemente la ventana hasta donde aparece la notificación de reserva en proceso
  const scrollHaciaNotificacion = useCallback(() => {
    setTimeout(() => {
      const el = notificacionRef.current || document.getElementById('notificacion-reserva');
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 60);
  }, []);

  // Efecto que redirige automáticamente hacia la notificación al registrarse una selección
  useEffect(() => {
    if (reservaEnProceso) {
      scrollHaciaNotificacion();
    }
  }, [reservaEnProceso, scrollHaciaNotificacion]);

  // Manejo de la acción de reserva con advertencia visual elegante y redirección visual
  const handleReservarGeneral = useCallback(() => {
    setReservaEnProceso((prev) => ({
      servicio: prev?.servicio,
      barbero: prev?.barbero,
    }));
    scrollHaciaNotificacion();
  }, [scrollHaciaNotificacion]);

  const handleReservarServicio = useCallback((servicio: Servicio) => {
    setReservaEnProceso((prev) => ({
      servicio: servicio.nombre,
      barbero: prev?.barbero,
    }));
    scrollHaciaNotificacion();
  }, [scrollHaciaNotificacion]);

  const handleReservarBarbero = useCallback((barbero: BarberoCatalogo) => {
    const nombreBarbero = `${barbero.nombre} ${barbero.apellido}`.trim();
    setReservaEnProceso((prev) => ({
      servicio: prev?.servicio,
      barbero: nombreBarbero,
    }));
    scrollHaciaNotificacion();
  }, [scrollHaciaNotificacion]);

  return (
    <div className="kyrios-home min-vh-100 d-flex flex-column">
      {/* ── Navbar público con marca Kyrios Studio y estado Keycloak ── */}
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={() => navigate('/login')}
      />

      {/* ── Contenido público principal ── */}
      <main className="flex-grow-1 position-relative">
        {/* Banner no bloqueante de advertencia de reserva en proceso */}
        {reservaEnProceso && (
          <div
            id="notificacion-reserva"
            ref={notificacionRef}
            className="container py-3"
          >
            <ReservaEnProcesoAlert
              servicioNombre={reservaEnProceso.servicio}
              barberoNombre={reservaEnProceso.barbero}
              onClose={() => setReservaEnProceso(null)}
              onIrAServicios={() => {
                const el = document.getElementById('servicios');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              onIrABarberos={() => {
                const el = document.getElementById('barberos');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </div>
        )}

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

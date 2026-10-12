import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import '../../Home/home.css';
import { useServiciosCatalogo } from '../../../features/servicios/api/servicios.facade';
import type { Servicio } from '../../../features/servicios/types/servicios.types';
import HomeNavbar from '../../Home/components/HomeNavbar';
import HomeFooter from '../../Home/components/HomeFooter';
import ServiceCard from '../../Home/components/ServiceCard';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import { useDebounce } from '../../../shared/lib/useDebounce';
import { useAuth } from '../../../auth/AuthContext';

/* ─── Skeletons reutilizables ──────────────────────────────────────────────── */
const ServiceSkeleton: React.FC = () => (
  <div className="kyrios-service-card" style={{ minHeight: '380px', opacity: 0.6 }}>
    <div
      className="kyrios-service-img-wrap d-flex align-items-center justify-content-center"
      style={{ background: 'var(--home-surface-alt)' }}
    >
      <KyriosSpinner size="sm" aria-hidden="true" />
    </div>
    <div className="p-4">
      <div className="placeholder-glow mb-2" style={{ height: '22px', width: '60%', background: 'var(--home-surface-border)' }} />
      <div className="placeholder-glow mb-1" style={{ height: '14px', width: '90%', background: 'var(--home-meta-border)' }} />
      <div className="placeholder-glow" style={{ height: '14px', width: '75%', background: 'var(--home-meta-border)' }} />
    </div>
  </div>
);

/* ─── Página principal ─────────────────────────────────────────────────────── */
const CatalogoServiciosPage: React.FC = () => {
  const { isAuthenticated, nombre } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 350);

  // Actualiza la URL sin crear entradas en el historial al buscar
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, setSearchParams, searchParams]);

  // SEO: título dinámico de la pestaña
  useEffect(() => {
    document.title = 'Catálogo de Servicios | Kyrios Studio';
    return () => { document.title = 'Kyrios Studio'; };
  }, []);

  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();

  // Solo activos en la vista pública
  const serviciosActivos = servicios.filter((s) => s.estado === 'ACTIVO');

  // Filtrado client-side: no se necesita una segunda petición al servidor
  const serviciosFiltrados = debouncedQuery.trim()
    ? serviciosActivos.filter((s) =>
        s.nombre.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : serviciosActivos;

  const handleLogin = useCallback(() => {
    // La lógica de login la gestiona Keycloak a través del AuthContext
    window.location.href = '/dashboard';
  }, []);

  const limpiarBusqueda = useCallback(() => setQuery(''), []);

  const isSearching = query !== debouncedQuery;

  return (
    <div className="kyrios-home d-flex flex-column" style={{ minHeight: '100vh' }}>
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={handleLogin}
      />

      {/* ── Hero compacto ── */}
      <section
        className="kyrios-section"
        style={{ paddingTop: 'clamp(5rem, 10vw, 7rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}
        aria-labelledby="catalogo-servicios-heading"
      >
        <div className="container">
          {/* Breadcrumb accesible */}
          <nav aria-label="Ruta de navegación" className="mb-3">
            <ol className="d-flex align-items-center gap-1 list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
              <li>
                <Link to="/" className="kyrios-footer-link">Inicio</Link>
              </li>
              <li aria-hidden="true" className="text-surface-muted">/</li>
              <li className="text-surface-muted" aria-current="page">Servicios</li>
            </ol>
          </nav>

          <div className="kyrios-section-header text-center mx-auto kyrios-fade-in" style={{ maxWidth: '680px' }}>
            <span className="kyrios-eyebrow justify-content-center mb-2">Catálogo Profesional</span>
            <h1 id="catalogo-servicios-heading" className="kyrios-section-title kyrios-title-display">
              Nuestro Catálogo
            </h1>
            <p className="kyrios-section-desc mx-auto">
              Encuentra el servicio ideal para ti. Técnica, precisión y los mejores
              productos del mercado en cada visita.
            </p>
          </div>

          {/* Buscador */}
          <div className="mx-auto mt-4" style={{ maxWidth: '480px' }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar servicio…"
              ariaLabel="Buscar en el catálogo de servicios"
              isSearching={isSearching}
            />
          </div>
        </div>
      </section>

      {/* ── Grid de resultados ── */}
      <section
        className="kyrios-section kyrios-section--alt"
        style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', flex: 1 }}
      >
        <div className="container">
          {/* Estado: Cargando */}
          {isLoading && (
            <div className="row g-4" aria-busy="true" aria-label="Cargando catálogo de servicios">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="col-12 col-md-6 col-lg-4">
                  <ServiceSkeleton />
                </div>
              ))}
            </div>
          )}

          {/* Estado: Error de red */}
          {!isLoading && error && (
            <div className="text-center py-5">
              <p className="kyrios-section-desc mb-3 mx-auto">
                No se pudo cargar el catálogo de servicios en este momento.
              </p>
              <button type="button" className="btn-kyrios-dark px-3 py-1" onClick={() => refetch()}>
                Reintentar
              </button>
            </div>
          )}

          {/* Resultados con aria-live para lectores de pantalla */}
          {!isLoading && !error && (
            <div
              aria-live="polite"
              aria-atomic="true"
              className="search-results-fade"
            >
              {/* Contador de resultados (solo con búsqueda activa) */}
              {debouncedQuery.trim() && (
                <p className="text-surface-muted small mb-4 text-center" role="status">
                  {serviciosFiltrados.length === 0
                    ? 'Sin resultados'
                    : `${serviciosFiltrados.length} servicio${serviciosFiltrados.length !== 1 ? 's' : ''} encontrado${serviciosFiltrados.length !== 1 ? 's' : ''}`}
                </p>
              )}

              {/* Grid */}
              {serviciosFiltrados.length > 0 ? (
                <div className="row g-4">
                  {serviciosFiltrados.map((servicio: Servicio) => (
                    <div key={servicio.id} className="col-12 col-md-6 col-lg-4">
                      <ServiceCard
                        servicio={servicio}
                        // El catálogo público no tiene flujo de reserva;
                        // redirige al home para que el usuario reserve desde allí
                        onReservar={() => {
                          window.location.href = `/#servicios`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ animation: 'var(--catalog-empty-fade, fadeInUp 150ms ease-out)' }}>
                  <EmptyState
                    icon={<Scissors size={40} />}
                    title={debouncedQuery.trim() ? 'Sin resultados para tu búsqueda' : 'Próximamente disponible'}
                    description={
                      debouncedQuery.trim()
                        ? `No encontramos servicios que coincidan con "${debouncedQuery}".`
                        : 'Estamos preparando el catálogo de servicios. Vuelve pronto.'
                    }
                    actionLabel={debouncedQuery.trim() ? 'Limpiar búsqueda' : undefined}
                    onAction={debouncedQuery.trim() ? limpiarBusqueda : undefined}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <HomeFooter />
    </div>
  );
};

export default CatalogoServiciosPage;

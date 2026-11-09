import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import '../../Home/home.css';
import { useBarberosCatalogo } from '../../../features/barberos/api/barberos.facade';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import HomeNavbar from '../../Home/components/HomeNavbar';
import HomeFooter from '../../Home/components/HomeFooter';
import BarberCard from '../../Home/components/BarberCard';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import { useDebounce } from '../../../shared/lib/useDebounce';
import { useAuth } from '../../../auth/AuthContext';

/* ─── Skeleton de tarjeta ─────────────────────────────────────────────────── */
const BarberSkeleton: React.FC = () => (
  <div className="kyrios-barber-card" style={{ opacity: 0.6 }}>
    <div
      className="kyrios-barber-img-wrap d-flex align-items-center justify-content-center"
      style={{ background: 'var(--home-surface-alt)' }}
    >
      <KyriosSpinner size="sm" aria-hidden="true" />
    </div>
    <div className="p-3">
      <div className="placeholder-glow mb-2" style={{ height: '20px', width: '70%', background: 'var(--home-surface-border)' }} />
      <div className="placeholder-glow" style={{ height: '14px', width: '40%', background: 'var(--home-meta-border)' }} />
    </div>
  </div>
);

function filtrarBarberos(barberos: BarberoCatalogo[], query: string): BarberoCatalogo[] {
  const limpio = query.trim().toLowerCase();
  if (!limpio) return barberos;
  return barberos.filter((b) => {
    const nombreCompleto = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nombreCompleto.includes(limpio);
  });
}

function textoResultadosBarberos(total: number): string {
  if (total === 0) return 'Sin resultados';
  return `${total} barbero${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

/* ─── Página principal ─────────────────────────────────────────────────────── */
const CatalogoBarberosPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const basePrefix = slug ? `/${slug}` : '';
  const { isAuthenticated, nombre } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 350);

  // Sincroniza el estado de búsqueda con los URL params sin crear historial
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, setSearchParams, searchParams]);

  // Título dinámico gestionado por TenantBrandContext

  const { data: barberos = [], isLoading, error, refetch } = useBarberosCatalogo();
  const barberosFiltrados = useMemo(
    () => filtrarBarberos(barberos, debouncedQuery),
    [barberos, debouncedQuery]
  );

  const handleLogin = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  const limpiarBusqueda = useCallback(() => setQuery(''), []);

  const isSearching = query !== debouncedQuery;

  return (
    <div className="kyrios-home d-flex flex-column" style={{ minHeight: '100dvh' }}>
      <HomeNavbar
        isAuthenticated={isAuthenticated}
        nombre={nombre}
        onLogin={handleLogin}
      />

      {/* ── Breadcrumb + buscador ─────────────────────────────────────────── */}
      <section
        className="kyrios-section"
        style={{ paddingTop: 'clamp(4rem, 8vw, 5.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 2rem)' }}
        aria-labelledby="catalogo-barberos-heading"
      >
        <div className="container">
          {/* h1 oculto visualmente: mantiene jerarquía para SEO y lectores de pantalla */}
          <h1 id="catalogo-barberos-heading" className="visually-hidden">Barberos</h1>

          {/* Breadcrumb accesible */}
          <nav aria-label="Ruta de navegación" className="mb-3">
            <ol className="d-flex align-items-center gap-1 list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
              <li>
                <Link to={basePrefix || "/"} className="kyrios-footer-link">Inicio</Link>
              </li>
              <li aria-hidden="true" className="text-surface-muted">/</li>
              <li className="text-surface-muted" aria-current="page">Barberos</li>
            </ol>
          </nav>

          {/* Buscador */}
          <div className="mx-auto" style={{ maxWidth: '480px' }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar barbero por nombre…"
              ariaLabel="Buscar en el catálogo de barberos"
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
            <div className="row g-2 g-sm-3 g-md-4 catalog-grid-2col justify-content-center" aria-busy="true" aria-label="Cargando equipo de barberos">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="col-6 col-sm-6 col-md-4 col-xl-3">
                  <BarberSkeleton />
                </div>
              ))}
            </div>
          )}

          {/* Estado: Error de red */}
          {!isLoading && error && (
            <div className="text-center py-5">
              <p className="kyrios-section-desc mb-3 mx-auto">
                No fue posible cargar el equipo de barberos en este momento.
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
              {/* Contador visible solo cuando hay búsqueda activa */}
              {debouncedQuery.trim() && (
                <p className="text-surface-muted small mb-4 text-center" role="status">
                  {textoResultadosBarberos(barberosFiltrados.length)}
                </p>
              )}

              {/* Grid */}
              {barberosFiltrados.length > 0 ? (
                <div className="row g-3 g-lg-4 justify-content-center">
                  {barberosFiltrados.map((barbero: BarberoCatalogo) => (
                    <div key={barbero.id} className="col-12 col-md-6 col-lg-4">
                      <BarberCard
                        barbero={barbero}
                        onReservar={(b, servicioId) => {
                          void navigate(`${basePrefix}/reservar`, {
                            state: {
                              barberoId: b.id,
                              origen: 'barbero',
                              ...(servicioId ? { servicioId, paso: 3 } : {}),
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ animation: 'var(--catalog-empty-fade, fadeInUp 150ms ease-out)' }}>
                  <EmptyState
                    icon={<Users size={40} />}
                    title={debouncedQuery.trim() ? 'Sin resultados para tu búsqueda' : 'Equipo disponible próximamente'}
                    description={
                      debouncedQuery.trim()
                        ? `No encontramos barberos que coincidan con "${debouncedQuery}".`
                        : 'Nuestro equipo de profesionales estará disponible muy pronto.'
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

export default CatalogoBarberosPage;

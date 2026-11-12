import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import '../../Home/home.css';
import { useProductosCatalogo } from '../../../features/productos/api/productos.facade';
import type { ProductoCatalogoDTO } from '../../../features/productos/api/productos.dto';
import HomeNavbar from '../../Home/components/HomeNavbar';
import HomeFooter from '../../Home/components/HomeFooter';
import ProductCard from './ProductCard';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import { useDebounce } from '../../../shared/lib/useDebounce';
import { useAuth } from '../../../auth/AuthContext';

const ProductSkeleton: React.FC = () => (
  <div className="kyrios-service-card" style={{ opacity: 0.6 }}>
    <div
      className="kyrios-service-img-wrap d-flex align-items-center justify-content-center"
      style={{ background: 'var(--home-surface-alt)' }}
    >
      <KyriosSpinner size="sm" aria-hidden="true" />
    </div>
    <div className="p-4">
      <div
        className="placeholder-glow mb-2"
        style={{ height: '22px', width: '60%', background: 'var(--home-surface-border)' }}
      />
      <div
        className="placeholder-glow mb-1"
        style={{ height: '14px', width: '90%', background: 'var(--home-meta-border)' }}
      />
      <div
        className="placeholder-glow"
        style={{ height: '14px', width: '75%', background: 'var(--home-meta-border)' }}
      />
    </div>
  </div>
);

function filtrarProductos(productos: ProductoCatalogoDTO[], query: string): ProductoCatalogoDTO[] {
  const limpio = query.trim().toLowerCase();
  if (!limpio) return productos;
  return productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(limpio) ||
      p.descripcion?.toLowerCase().includes(limpio)
  );
}

function textoResultadosProductos(total: number): string {
  if (total === 0) return 'Sin resultados';
  return `${total} producto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
}

export const CatalogoProductosPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const basePrefix = slug ? `/${slug}` : '';
  const { isAuthenticated, nombre } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, setSearchParams, searchParams]);

  const { data: productos = [], isLoading, error, refetch } = useProductosCatalogo();
  const productosFiltrados = useMemo(
    () => filtrarProductos(productos, debouncedQuery),
    [productos, debouncedQuery]
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

      {/* Breadcrumb + Buscador */}
      <section
        className="kyrios-section"
        style={{
          paddingTop: 'clamp(4rem, 8vw, 5.5rem)',
          paddingBottom: 'clamp(1.5rem, 3vw, 2rem)',
        }}
        aria-labelledby="catalogo-productos-heading"
      >
        <div className="container">
          <h1 id="catalogo-productos-heading" className="visually-hidden">
            Catálogo de Productos
          </h1>

          <nav aria-label="Ruta de navegación" className="mb-3">
            <ol
              className="d-flex align-items-center gap-1 list-unstyled mb-0"
              style={{ fontSize: '0.8rem' }}
            >
              <li>
                <Link to={basePrefix || '/'} className="kyrios-footer-link">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true" className="text-surface-muted">
                /
              </li>
              <li className="text-surface-muted" aria-current="page">
                Productos
              </li>
            </ol>
          </nav>

          <div className="text-center mb-4">
            <h2 className="kyrios-section-title mb-2">Productos Exclusivos</h2>
            <p className="kyrios-section-desc mx-auto" style={{ maxWidth: '600px' }}>
              Encuentra los mejores artículos de cuidado capilar, ceras, aceites y accesorios
              profesionales para mantener tu estilo todos los días.
            </p>
          </div>

          <div className="mx-auto" style={{ maxWidth: '480px' }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar producto por nombre o descripción…"
              ariaLabel="Buscar en el catálogo de productos"
              isSearching={isSearching}
            />
          </div>
        </div>
      </section>

      {/* Grid de Resultados */}
      <section
        className="kyrios-section kyrios-section--alt"
        style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', flex: 1 }}
      >
        <div className="container">
          {isLoading && (
            <div
              className="row g-2 g-sm-3 g-md-4 catalog-grid-2col"
              aria-busy="true"
              aria-label="Cargando catálogo de productos"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="col-6 col-md-6 col-lg-4">
                  <ProductSkeleton />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-5">
              <p className="kyrios-section-desc mb-3 mx-auto">
                No se pudo cargar el catálogo de productos en este momento.
              </p>
              <button
                type="button"
                className="btn-kyrios-dark px-3 py-1"
                onClick={() => refetch()}
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div aria-live="polite" aria-atomic="true" className="search-results-fade">
              {debouncedQuery.trim() && (
                <p className="text-surface-muted small mb-4 text-center" role="status">
                  {textoResultadosProductos(productosFiltrados.length)}
                </p>
              )}

              {productosFiltrados.length > 0 ? (
                <div className="row g-3 g-lg-4">
                  {productosFiltrados.map((producto) => (
                    <div key={producto.id} className="col-12 col-md-6 col-lg-4">
                      <ProductCard producto={producto} />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <EmptyState
                    icon={<Package size={40} />}
                    title={
                      debouncedQuery.trim()
                        ? 'Sin resultados para tu búsqueda'
                        : 'Próximamente disponible'
                    }
                    description={
                      debouncedQuery.trim()
                        ? `No encontramos productos que coincidan con "${debouncedQuery}".`
                        : 'Estamos preparando el catálogo de productos para esta barbería. Vuelve pronto.'
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

export default CatalogoProductosPage;


import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useBarberosCatalogo } from '../api/barberos.facade';
import BarberoCard from '../components/BarberoCard';
import { useToast } from '../../../shared/lib/useToast';
import { ToastContainer } from '../../../shared/ui/ToastContainer';
import { useDebounce } from '../../../shared/lib/useDebounce';

export const BarberosPage: React.FC = () => {
  const { roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const esSuperAdmin = roles.includes('SUPERADMIN');
  const esAdministrador = roles.includes('ADMINISTRADOR');
  const puedeCrearBarbero = esSuperAdmin || esAdministrador;

  // Estado local para búsqueda inmediata (evita lag en input)
  const [filtroNombre, setFiltroNombre] = useState('');
  const debouncedNombre = useDebounce(filtroNombre, 350);

  const {
    data: barberos = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBarberosCatalogo();

  const { toast, showToast, hideToast } = useToast(4000);

  useEffect(() => {
    const mensaje = location.state?.mensaje as string | undefined;
    if (!mensaje) return;
    showToast('success', mensaje);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state?.mensaje, location.pathname, navigate, showToast]);

  const barberosFiltrados = useMemo(() => {
    if (!debouncedNombre.trim()) return barberos;
    const q = debouncedNombre.toLowerCase().trim();
    return barberos.filter((b) =>
      `${b.nombre} ${b.apellido}`.toLowerCase().includes(q)
    );
  }, [barberos, debouncedNombre]);

  return (
    <div className="container-fluid py-2">
      <ToastContainer toast={toast} onClose={hideToast} />

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold mb-1">Equipo de Barberos</h1>
          <p className="text-surface-muted mb-0">
            Conoce a nuestros profesionales especializados y agenda tu corte o servicio.
          </p>
        </div>

        {puedeCrearBarbero && (
          <Link to="/barberos/nuevo" className="btn btn-primary">
            + Nuevo Barbero
          </Link>
        )}
      </div>

      {/* Barra de búsqueda debounced */}
      <div className="mb-4" style={{ maxWidth: '440px' }}>
        <div className="position-relative">
          <input
            type="text"
            className="form-control pe-5"
            placeholder="Buscar barbero por nombre..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            style={{
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            aria-label="Buscar barbero por nombre"
          />

          {filtroNombre !== debouncedNombre && (
            <div
              className="position-absolute end-0 top-50 translate-middle-y me-3 d-flex align-items-center"
              style={{ pointerEvents: 'none' }}
              title="Filtrando..."
            >
              <KyriosSpinner size="xs" aria-hidden="true" />
            </div>
          )}
        </div>

        {filtroNombre !== debouncedNombre && (
          <div
            className="text-surface-muted small mt-1 ms-1"
            style={{ fontSize: '0.75rem', animation: 'fadeInSpinner 120ms ease-out' }}
          >
            Buscando...
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage
          message={error.message || 'Error cargando catálogo de barberos.'}
          onRetry={refetch}
        />
      )}

      {isLoading && barberos.length === 0 ? (
        <Spinner mensaje="Cargando el equipo de barberos..." />
      ) : barberosFiltrados.length === 0 ? (
        <div className="alert-surface text-center py-5 px-3 text-surface-muted border rounded">
          <p className="mb-2 fs-6 fw-semibold text-surface-card">
            {debouncedNombre
              ? `No se encontraron barberos que coincidan con "${debouncedNombre}".`
              : 'No hay barberos registrados en el catálogo en este momento.'}
          </p>
          {debouncedNombre && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setFiltroNombre('')}
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div
          className={`row g-4 search-results-fade ${
            isFetching && barberos.length > 0 ? 'opacity-75' : ''
          }`}
          style={{ transition: 'opacity 150ms ease' }}
        >
          {barberosFiltrados.map((barbero) => (
            <BarberoCard key={barbero.id} barbero={barbero} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BarberosPage;

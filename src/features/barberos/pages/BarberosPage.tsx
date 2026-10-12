import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import { useBarberosCatalogo } from '../api/barberos.facade';
import BarberoCard from '../components/BarberoCard';
import { useToastContext } from '../../../shared/ui/ToastContext';
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

  const { showToast } = useToastContext();

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
        <SearchInput
          placeholder="Buscar barbero por nombre..."
          value={filtroNombre}
          onChange={setFiltroNombre}
          isSearching={filtroNombre !== debouncedNombre}
          ariaLabel="Buscar barbero por nombre"
        />
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
        <EmptyState
          title={
            debouncedNombre
              ? `No se encontraron barberos que coincidan con "${debouncedNombre}".`
              : 'No hay barberos registrados en el catálogo en este momento.'
          }
          actionLabel={debouncedNombre ? 'Limpiar búsqueda' : undefined}
          onAction={debouncedNombre ? () => setFiltroNombre('') : undefined}
        />
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

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useBarberosCatalogo } from '../api/barberos.facade';
import BarberoCard from '../components/BarberoCard';

export const BarberosPage: React.FC = () => {
  const { roles } = useAuth();
  const location = useLocation();

  const esSuperAdmin = roles.includes('SUPERADMIN');
  const esAdministrador = roles.includes('ADMINISTRADOR');
  const puedeCrearBarbero = esSuperAdmin || esAdministrador;

  const {
    data: barberos = [],
    isLoading,
    error,
    refetch,
  } = useBarberosCatalogo();

  const mensajeExito = location.state?.mensaje as string | undefined;

  return (
    <div className="container-fluid py-2">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold mb-1">Equipo de Barberos</h1>
          <p className="text-muted mb-0">
            Conoce a nuestros profesionales especializados y agenda tu corte o servicio.
          </p>
        </div>

        {puedeCrearBarbero && (
          <Link to="/barberos/nuevo" className="btn btn-primary">
            + Nuevo Barbero
          </Link>
        )}
      </div>

      {mensajeExito && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          {mensajeExito}
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error.message || 'Error cargando catálogo de barberos.'}
          onRetry={refetch}
        />
      )}

      {isLoading ? (
        <Spinner mensaje="Cargando el equipo de barberos..." />
      ) : barberos.length === 0 ? (
        <div className="alert alert-light border text-center py-5 text-muted">
          No hay barberos registrados en el catálogo en este momento.
        </div>
      ) : (
        <div className="row g-4">
          {barberos.map((barbero) => (
            <BarberoCard key={barbero.id} barbero={barbero} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BarberosPage;

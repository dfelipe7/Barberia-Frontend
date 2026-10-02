import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useBarberosCatalogo } from '../api/barberos.facade';
import BarberoCard from '../components/BarberoCard';
import { useToast } from '../../../shared/lib/useToast';
import { ToastContainer } from '../../../shared/ui/ToastContainer';

export const BarberosPage: React.FC = () => {
  const { roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const esSuperAdmin = roles.includes('SUPERADMIN');
  const esAdministrador = roles.includes('ADMINISTRADOR');
  const puedeCrearBarbero = esSuperAdmin || esAdministrador;

  const {
    data: barberos = [],
    isLoading,
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

  return (
    <div className="container-fluid py-2">
      <ToastContainer toast={toast} onClose={hideToast} />

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

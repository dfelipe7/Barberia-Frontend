import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';
import BrandLogo from '../../shared/ui/BrandLogo';
import Button from '../../shared/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center p-3 bg-surface-app"
      style={{ minHeight: '100vh' }}
    >
      <div className="card-surface card shadow p-4 p-md-5" style={{ maxWidth: 480, width: '100%' }}>
        <div className="mb-4">
          <BrandLogo variant="auto" height={40} className="mx-auto" />
        </div>
        <div className="mb-3 text-primary d-flex justify-content-center" aria-hidden="true">
          <Construction size={48} />
        </div>
        <h1 className="h3 fw-bold mb-2">Página en desarrollo</h1>
        <p className="text-surface-muted mb-4">
          Esta sección estará disponible muy pronto. Mientras tanto, puedes volver al panel o al inicio.
        </p>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100">
          <Button
            variant="primary"
            className="flex-fill"
            onClick={() => navigate('/dashboard')}
            autoFocus
          >
            Volver al panel
          </Button>
          <Button
            variant="outline-secondary"
            className="flex-fill"
            onClick={() => navigate('/')}
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}


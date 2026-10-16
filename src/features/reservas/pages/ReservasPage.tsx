import { CalendarPlus, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import ReservasBarberoPage from './ReservasBarberoPage';
import BackLink from '../../../shared/ui/BackLink';

export default function ReservasPage() {
  const { roles } = useAuth();
  if (roles.includes('BARBERO')) return <ReservasBarberoPage />;

  return (
    <main className="container-fluid p-3 p-md-4">
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">GESTIÓN / AGENDA</span>
          <h1 className="h2 fw-bold mb-1">Reservas</h1>
          <p className="text-surface-muted mb-0">Registra una cita para un cliente y consulta disponibilidad por barbero.</p>
        </div>
        <BackLink to="/dashboard">Volver al panel</BackLink>
      </header>
      <section className="card card-surface border-0 shadow-sm" style={{ maxWidth: 720 }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-start gap-3">
            <div className="rounded-circle bg-primary-subtle text-primary p-3"><CalendarPlus size={24} /></div>
            <div>
              <h2 className="h5 fw-bold">Crear reserva</h2>
              <p className="text-surface-muted">Busca un cliente registrado o registra a una persona como invitada, selecciona un servicio y elige una franja que el barbero tenga disponible.</p>
              <Link className="btn btn-primary" to="/reservas/nueva"><Scissors size={17} className="me-2" />Nueva reserva</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

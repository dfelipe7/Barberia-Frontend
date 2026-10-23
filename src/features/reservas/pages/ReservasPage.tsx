import { lazy, Suspense, useState, useEffect } from 'react';
import { CalendarPlus, Scissors, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import ReservasBarberoPage from './ReservasBarberoPage';
import BackLink from '../../../shared/ui/BackLink';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import './ReservasPage.css';

const ReservasAdministrativasPage = lazy(() => import('./ReservasAdministrativasPage'));

const STORAGE_KEY = 'kyrios_reservas_vista_preferida';

export default function ReservasPage() {
  const { roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const esBarbero = roles.includes('BARBERO');
  const esAdmin = roles.includes('SUPERADMIN') || roles.includes('ADMINISTRADOR');

  // Vista activa para usuarios híbridos (esBarbero && esAdmin)
  const [vista, setVista] = useState<'admin' | 'barbero'>(() => {
    const param = searchParams.get('vista');
    if (param === 'admin' || param === 'barbero') return param;
    const guardada = localStorage.getItem(STORAGE_KEY);
    if (guardada === 'admin' || guardada === 'barbero') return guardada;
    return 'admin';
  });

  // Sincronizar parámetro de URL si cambia externamente
  useEffect(() => {
    const param = searchParams.get('vista');
    if (param === 'admin' || param === 'barbero') {
      setVista(param);
    }
  }, [searchParams]);

  const cambiarVista = (nuevaVista: 'admin' | 'barbero') => {
    setVista(nuevaVista);
    setSearchParams({ vista: nuevaVista }, { replace: true });
    try {
      localStorage.setItem(STORAGE_KEY, nuevaVista);
    } catch {
      // Fallback si localStorage no está disponible
    }
  };

  // 1. Rol único: solo Barbero
  if (esBarbero && !esAdmin) {
    return <ReservasBarberoPage />;
  }

  // 2. Rol único: solo Administrador o Superadmin
  if (esAdmin && !esBarbero) {
    return (
      <Suspense fallback={<div className="d-flex justify-content-center py-5"><KyriosSpinner /></div>}>
        <ReservasAdministrativasPage />
      </Suspense>
    );
  }

  // 3. Sin rol de staff (Cliente / Usuario común)
  if (!esBarbero && !esAdmin) {
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

  // 4. Roles combinados (esBarbero && esAdmin): Presentar el switcher con acceso inmediato a ambas consolas
  return (
    <div className="reservas-hibrida-wrapper">
      <div className="container-fluid px-3 px-md-4 pt-3 pt-md-4 pb-0">
        <div className="reservas-role-switcher card card-surface border shadow-sm p-2 mb-1">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
                <ShieldCheck size={13} aria-hidden="true" /> Roles combinados
              </span>
              <span className="small text-surface-muted d-none d-md-inline">
                Tienes perfil administrativo y de barbero. Alterna entre la gestión de la barbería y tu agenda:
              </span>
            </div>

            <div className="reservas-tabs-segmented w-100 w-lg-auto" role="tablist" aria-label="Cambiar vista de reservas">
              <button
                type="button"
                role="tab"
                aria-selected={vista === 'admin'}
                className={`reservas-tab-btn ${vista === 'admin' ? 'is-active' : ''}`}
                onClick={() => cambiarVista('admin')}
              >
                <SlidersHorizontal size={15} aria-hidden="true" className="flex-shrink-0" />
                <span className="d-none d-sm-inline">Gestión general (Admin)</span>
                <span className="d-sm-none text-truncate">Gestión Admin</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={vista === 'barbero'}
                className={`reservas-tab-btn ${vista === 'barbero' ? 'is-active' : ''}`}
                onClick={() => cambiarVista('barbero')}
              >
                <Scissors size={15} aria-hidden="true" className="flex-shrink-0" />
                <span className="d-none d-sm-inline">Mi agenda personal</span>
                <span className="d-sm-none text-truncate">Mi agenda</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="reservas-vista-contenedor" key={vista}>
        {vista === 'admin' ? (
          <Suspense fallback={<div className="d-flex justify-content-center py-5"><KyriosSpinner /></div>}>
            <ReservasAdministrativasPage />
          </Suspense>
        ) : (
          <ReservasBarberoPage />
        )}
      </div>
    </div>
  );
}

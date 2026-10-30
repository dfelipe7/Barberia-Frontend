import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './shared/layout/MainLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import ReservaClientePage from './features/reservas/pages/ReservaClientePage';
import ClienteAccesoPage from './features/reservas/pages/ClienteAccesoPage';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import LoginPage from './pages/Login/LoginPage';
import { routeConfig } from './shared/routes/routeConfig';
import KyriosSpinner from './shared/ui/KyriosSpinner';

// Helper para recargar la página automáticamente si falla la descarga de un chunk dinámico tras un despliegue
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      const key = 'chunk_reload_done';
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (!last || now - Number(last) > 10_000) {
        sessionStorage.setItem(key, now.toString());
        window.location.reload();
      }
      throw error;
    })
  );
}

// Páginas públicas de catálogo — lazy con recuperación automática ante chunks obsoletos
const CatalogoServiciosPage = lazyWithRetry(
  () => import('./pages/Catalogo/Servicios/CatalogoServiciosPage')
);
const CatalogoBarberosPage = lazyWithRetry(
  () => import('./pages/Catalogo/Barberos/CatalogoBarberosPage')
);

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<MainLayout />}>
          {routeConfig.map(({ path, element, roles }) => (
            <Route key={path} element={<ProtectedRoute rolesPermitidos={[...roles]} />}>
              <Route path={path} element={element} />
            </Route>
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Rutas dinámicas por barbería (/:slug) */}
        <Route path="/:slug" element={<HomePage />} />
        <Route path="/:slug/reservar" element={<ReservaClientePage />} />
        <Route path="/:slug/login" element={<LoginPage />} />
        <Route
          path="/:slug/catalogo/servicios"
          element={
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><KyriosSpinner /></div>}>
              <CatalogoServiciosPage />
            </Suspense>
          }
        />
        <Route
          path="/:slug/catalogo/barberos"
          element={
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><KyriosSpinner /></div>}>
              <CatalogoBarberosPage />
            </Suspense>
          }
        />

        {/* Rutas públicas directas (compatibilidad) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/reservar" element={<ReservaClientePage />} />
        <Route path="/cliente/registro" element={<ClienteAccesoPage modo="registro" />} />
        <Route path="/cliente/iniciar-sesion" element={<ClienteAccesoPage modo="iniciar-sesion" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sin-acceso" element={<SinAcceso />} />
        <Route
          path="/catalogo/servicios"
          element={
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><KyriosSpinner /></div>}>
              <CatalogoServiciosPage />
            </Suspense>
          }
        />
        <Route
          path="/catalogo/barberos"
          element={
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><KyriosSpinner /></div>}>
              <CatalogoBarberosPage />
            </Suspense>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

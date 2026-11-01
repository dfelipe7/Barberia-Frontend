import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './shared/layout/MainLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import ReservaClientePage from './features/reservas/pages/ReservaClientePage';
import ReservaGestionInvitadoPage from './features/reservas/pages/ReservaGestionInvitadoPage';
import ClienteAccesoPage from './features/reservas/pages/ClienteAccesoPage';
import ClientePortalPage from './features/reservas/pages/ClientePortalPage';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import LoginPage from './pages/Login/LoginPage';
import PlataformaHubPage from './pages/Plataforma/PlataformaHubPage';
import LandingPlataformaPage from './pages/Plataforma/LandingPlataformaPage';
import { routeConfig } from './shared/routes/routeConfig';
import KyriosSpinner from './shared/ui/KyriosSpinner';
import { obtenerNegocioSlugActivo } from './shared/lib/http/axios';
import { resolverTemaTenant } from './config/tenantTheme';
import { TenantBrandProvider } from './features/negocio/context/TenantBrandContext';

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
  const location = useLocation();

  useEffect(() => {
    const slug = obtenerNegocioSlugActivo();
    const tema = resolverTemaTenant(slug);
    document.documentElement.setAttribute('data-tenant-theme', tema);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <TenantBrandProvider>
        <Routes>
        <Route element={<MainLayout />}>
          {routeConfig.map(({ path, element, roles }) => (
            <Route key={path} element={<ProtectedRoute rolesPermitidos={[...roles]} />}>
              <Route path={path} element={element} />
              <Route path={`/:slug${path}`} element={element} />
            </Route>
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Rutas dinámicas por barbería (/:slug) */}
        <Route path="/:slug" element={<HomePage />} />
        <Route path="/:slug/reservar" element={<ReservaClientePage />} />
        <Route path="/:slug/reserva/gestion" element={<ReservaGestionInvitadoPage />} />
        <Route path="/:slug/c/:id/:token" element={<ReservaGestionInvitadoPage />} />
        <Route path="/:slug/login" element={<LoginPage />} />
        <Route path="/:slug/cliente/registro" element={<ClienteAccesoPage modo="registro" />} />
        <Route path="/:slug/cliente/iniciar-sesion" element={<ClienteAccesoPage modo="iniciar-sesion" />} />
        <Route path="/:slug/cliente/mi-cuenta" element={<ClientePortalPage />} />
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

        {/* Landing de la Plataforma SaaS en raíz */}
        <Route path="/" element={<LandingPlataformaPage />} />
        <Route path="/plataforma" element={<PlataformaHubPage />} />
        <Route path="/explorar" element={<PlataformaHubPage />} />
        <Route path="/reservar" element={<ReservaClientePage />} />
        <Route path="/reserva/gestion" element={<ReservaGestionInvitadoPage />} />
        <Route path="/c/:id/:token" element={<ReservaGestionInvitadoPage />} />
        <Route path="/cliente/registro" element={<ClienteAccesoPage modo="registro" />} />
        <Route path="/cliente/iniciar-sesion" element={<ClienteAccesoPage modo="iniciar-sesion" />} />
        <Route path="/cliente/mi-cuenta" element={<ClientePortalPage />} />
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
    </TenantBrandProvider>
  </ErrorBoundary>
  );
}

export default App;

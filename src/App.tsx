import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './shared/layout/MainLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import ReservaClientePage from './features/reservas/pages/ReservaClientePage';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import LoginPage from './pages/Login/LoginPage';
import { routeConfig } from './shared/routes/routeConfig';
import KyriosSpinner from './shared/ui/KyriosSpinner';

// Páginas públicas de catálogo — lazy para no aumentar el bundle inicial
const CatalogoServiciosPage = lazy(
  () => import('./pages/Catalogo/Servicios/CatalogoServiciosPage')
);
const CatalogoBarberosPage = lazy(
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

        {/* Rutas públicas fuera de MainLayout (sin sidebar, con HomeNavbar) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/reservar" element={<ReservaClientePage />} />
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

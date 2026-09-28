import { Route, Routes } from 'react-router-dom';
import MainLayout from './shared/layout/MainLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import { routeConfig } from './shared/routes/routeConfig';

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
        <Route path="/" element={<HomePage />} />
        <Route path="/sin-acceso" element={<SinAcceso />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
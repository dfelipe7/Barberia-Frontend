import { Route, Routes } from 'react-router-dom';

import MainLayout from './shared/layout/MainLayout';
import ProtectedRoute from './shared/components/ProtectedRoute';

import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import HomePage from './pages/Home/HomePage';

import UsuariosPage from './features/usuarios/pages/UsuariosPage';
import CrearAdministradorPage from './features/usuarios/pages/CrearAdministradorPage';
import EditarUsuarioPage from './features/usuarios/pages/EditarUsuarioPage';
import MiPerfilPage from './features/usuarios/pages/MiPerfilPage';

import BarberosPage from './features/barberos/pages/BarberosPage';
import CrearBarberoPage from './features/barberos/pages/CrearBarberoPage';

import ServiciosPage from './features/servicios/pages/ServiciosPage';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route element={<MainLayout />}>
        
        {/* Dashboard y perfil */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
                'ADMINISTRADOR',
                'BARBERO',
              ]}
            />
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/mi-perfil"
            element={<MiPerfilPage />}
          />
        </Route>

        {/* Gestión de usuarios */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
                'ADMINISTRADOR',
              ]}
            />
          }
        >
          <Route
            path="/usuarios"
            element={<UsuariosPage />}
          />

          <Route
            path="/usuarios/:id/editar"
            element={<EditarUsuarioPage />}
          />
        </Route>

        {/* Catálogo de barberos */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
                'ADMINISTRADOR',
                'BARBERO',
              ]}
            />
          }
        >
          <Route
            path="/barberos"
            element={<BarberosPage />}
          />
        </Route>

        {/* Crear barbero */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
                'ADMINISTRADOR',
              ]}
            />
          }
        >
          <Route
            path="/barberos/nuevo"
            element={<CrearBarberoPage />}
          />
        </Route>

        {/* Crear administrador */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
              ]}
            />
          }
        >
          <Route
            path="/administradores/nuevo"
            element={<CrearAdministradorPage />}
          />
        </Route>

        {/* Servicios */}
        <Route
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'SUPERADMIN',
                'ADMINISTRADOR',
              ]}
            />
          }
        >
          <Route
            path="/servicios"
            element={<ServiciosPage />}
          />
        </Route>

        {/* Página no encontrada */}
        <Route
          path="*"
          element={<NotFound />}
        />

      </Route>

      {/* Página principal pública */}
      <Route path="/" element={<HomePage />} />

      {/* Sin acceso - fuera del layout para usuarios sin roles */}
      <Route path="/sin-acceso" element={<SinAcceso />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
import { Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';

import UsuariosPage from './modules/usuarios/pages/UsuariosPage';
import BarberosPage from './modules/usuarios/pages/BarberosPage';
import CrearBarberoPage from './modules/usuarios/pages/CrearBarberoPage';
import CrearAdministradorPage from './modules/usuarios/pages/CrearAdministradorPage';
import EditarUsuarioPage from './modules/usuarios/pages/EditarUsuarioPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>

        {/* Dashboard */}
        <Route
          path="/"
          element={<Dashboard />}
        />

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
          path="/barberos"
          element={<BarberosPage />}
        />

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

        {/* Página no encontrada */}
        <Route
          path="*"
          element={<NotFound />}
        />

      </Route>
    </Routes>
  );
}

export default App;
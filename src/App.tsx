import { Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';
import SinAcceso from './pages/SinAcceso/SinAcceso';
import HomePage from './pages/Home/HomePage';

import UsuariosPage from './modules/usuarios/pages/UsuariosPage';
import BarberosPage from './modules/usuarios/pages/BarberosPage';
import CrearBarberoPage from './modules/usuarios/pages/CrearBarberoPage';
import CrearAdministradorPage from './modules/usuarios/pages/CrearAdministradorPage';
import EditarUsuarioPage from './modules/usuarios/pages/EditarUsuarioPage';
import MiPerfilPage from './modules/usuarios/pages/MiPerfilPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>

        {/* Dashboard */}
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
  );
}

export default App;
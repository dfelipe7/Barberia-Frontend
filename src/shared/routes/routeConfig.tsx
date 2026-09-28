import type { ReactNode } from 'react';
import { ROLES_APP } from '../lib/autorizacion/roles';
import Dashboard from '../../pages/Dashboard/Dashboard';
import MiPerfilPage from '../../features/usuarios/pages/MiPerfilPage';
import UsuariosPage from '../../features/usuarios/pages/UsuariosPage';
import CrearAdministradorPage from '../../features/usuarios/pages/CrearAdministradorPage';
import EditarUsuarioPage from '../../features/usuarios/pages/EditarUsuarioPage';
import BarberosPage from '../../features/barberos/pages/BarberosPage';
import CrearBarberoPage from '../../features/barberos/pages/CrearBarberoPage';
import ServiciosPage from '../../features/servicios/pages/ServiciosPage';

export interface RouteConfigItem {
  path: string;
  element: ReactNode;
  roles: readonly string[];
}

export const routeConfig: RouteConfigItem[] = [
  { path: '/dashboard', element: <Dashboard />, roles: ROLES_APP },
  { path: '/mi-perfil', element: <MiPerfilPage />, roles: ROLES_APP },
  { path: '/usuarios', element: <UsuariosPage />, roles: ['SUPERADMIN', 'ADMINISTRADOR'] },
  { path: '/usuarios/:id/editar', element: <EditarUsuarioPage />, roles: ['SUPERADMIN', 'ADMINISTRADOR'] },
  { path: '/barberos', element: <BarberosPage />, roles: ROLES_APP },
  { path: '/barberos/nuevo', element: <CrearBarberoPage />, roles: ['SUPERADMIN', 'ADMINISTRADOR'] },
  { path: '/administradores/nuevo', element: <CrearAdministradorPage />, roles: ['SUPERADMIN'] },
  { path: '/servicios', element: <ServiciosPage />, roles: ['SUPERADMIN', 'ADMINISTRADOR'] },
];

/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useUi } from '../contexts/UiContext';

/**
 * Re-exportación para retrocompatibilidad con código existente.
 * La fuente única de la verdad es UiContext / useUi.
 */
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useSidebar = useUi;

export default useSidebar;

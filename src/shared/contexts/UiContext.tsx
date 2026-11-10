/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface UiContextType {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  /** Estado de colapso para sidebar en desktop */
  isCollapsed: boolean;
  toggleCollapse: () => void;
  /** Alias para compatibilidad con código existente */
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((v) => !v), []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {
        // Ignorar excepciones en entornos restringidos de almacenamiento
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      isCollapsed,
      toggleCollapse,
      // Alias de compatibilidad
      isMobileOpen: isSidebarOpen,
      openMobile: openSidebar,
      closeMobile: closeSidebar,
      toggleMobile: toggleSidebar,
    }),
    [isSidebarOpen, openSidebar, closeSidebar, toggleSidebar, isCollapsed, toggleCollapse]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextType {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUi debe usarse dentro de UiProvider');
  }
  return ctx;
}

export default UiContext;

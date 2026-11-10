import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, User, Globe, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { ROLES_APP } from '../constants/roles';
import UserAvatar from '../ui/atoms/UserAvatar';
import RoleBadge from '../ui/atoms/RoleBadge';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';
import { useTheme } from '../context/ThemeContext';

export interface UserDropdownProps {
  nombre?: string;
  apellido?: string;
  email?: string;
  roles: string[];
  fotoUrl?: string | null;
  isDark: boolean;
  onCerrarSesion: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  nombre,
  apellido,
  email,
  roles,
  fotoUrl,
  isDark,
  onCerrarSesion,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rolesApp = roles.filter((r) => (ROLES_APP as readonly string[]).includes(r));
  const rolesAMostrar = rolesApp.length > 0 ? rolesApp : roles;
  const slugActivo = obtenerNegocioSlugActivo() || localStorage.getItem('negocio_slug') || 'kyrios-studio';
  const rutaSitioPublico = `/${slugActivo}`;
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const THEME_ICONS = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  } as const;

  const THEME_LABELS = {
    dark: 'Tema: Oscuro',
    light: 'Tema: Claro',
    system: 'Tema: Sistema',
  } as const;

  const ThemeIcon = THEME_ICONS[theme] ?? Monitor;
  const themeLabel = THEME_LABELS[theme] ?? 'Tema: Sistema';

  const closeDropdown = () => {
    if (!isOpen || isExiting) return;
    setIsExiting(true);

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      triggerRef.current?.focus();
    }, 120);
  };

  const handleToggle = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setIsOpen(true);
      setIsExiting(false);
    }
  };

  // Limpieza del timer al desmontar
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Foco en el primer elemento interactivo al abrir
  useEffect(() => {
    if (isOpen && !isExiting) {
      const menuEl = menuRef.current;
      if (menuEl) {
        const focusable = menuEl.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }
  }, [isOpen, isExiting]);

  // Click fuera, Escape y Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return;
      }

      if (e.key === 'Tab') {
        const menuEl = menuRef.current;
        if (!menuEl) return;

        const focusables = Array.from(
          menuEl.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isExiting]);

  return (
    <div className="position-relative d-inline-block">
      {/* Botón Trigger */}
      <button
        ref={triggerRef}
        id="user-dropdown-trigger"
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-dropdown-menu"
        aria-label="Abrir menú de usuario"
        className={`user-dropdown-trigger ${isDark ? 'user-dropdown-trigger--dark' : ''} d-inline-flex align-items-center gap-1`}
      >
        <UserAvatar nombre={nombre} apellido={apellido} fotoUrl={fotoUrl} size={32} />
        <ChevronDown
          size={14}
          className={`user-dropdown-chevron ${isDark ? 'text-white-50' : 'text-muted'}`}
          aria-hidden="true"
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div
          ref={menuRef}
          id="user-dropdown-menu"
          role="menu"
          aria-labelledby="user-dropdown-trigger"
          className={`user-dropdown-menu ${isExiting ? 'user-dropdown-menu--exiting' : ''} ${isDark ? 'user-dropdown-menu--dark' : ''} p-2`}
        >
          {/* Identidad del usuario */}
          <div className="p-2 mb-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <UserAvatar nombre={nombre} apellido={apellido} fotoUrl={fotoUrl} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="fw-bold text-truncate text-surface-card"
                  style={{
                    fontSize: '0.925rem',
                  }}
                >
                  {nombre} {apellido}
                </div>
                {email && (
                  <div
                    className="text-surface-card-muted small text-truncate"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {email}
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {rolesAMostrar.map((rol) => (
                <RoleBadge key={rol} rol={rol} />
              ))}
            </div>
          </div>

          <hr className="my-1 user-dropdown-divider" />

          {/* Opciones */}
          <Link
            to={slugActivo ? `/${slugActivo}/mi-perfil` : '/mi-perfil'}
            role="menuitem"
            className="user-dropdown-item d-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded"
            onClick={closeDropdown}
          >
            <User size={16} strokeWidth={2} />
            <span>Mi Perfil</span>
          </Link>

          <Link
            to={rutaSitioPublico}
            role="menuitem"
            className="user-dropdown-item d-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded"
            onClick={closeDropdown}
          >
            <Globe size={16} strokeWidth={2} />
            <span>Sitio público</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            className="user-dropdown-item d-md-none d-flex align-items-center justify-content-between w-100 text-start border-0 bg-transparent px-3 py-2 rounded"
            onClick={cycleTheme}
            aria-label={`Cambiar tema actual: ${themeLabel}`}
          >
            <div className="d-flex align-items-center gap-2">
              <ThemeIcon size={16} strokeWidth={2} />
              <span>{themeLabel}</span>
            </div>
            <span className="badge bg-secondary-subtle text-body small">Cambiar</span>
          </button>

          <hr className="my-1 user-dropdown-divider" />

          <button
            type="button"
            role="menuitem"
            className="user-dropdown-item user-dropdown-item--danger d-flex align-items-center gap-2 w-100 text-start border-0 bg-transparent px-3 py-2 rounded"
            onClick={() => {
              closeDropdown();
              onCerrarSesion();
            }}
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

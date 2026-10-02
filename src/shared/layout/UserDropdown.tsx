import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, User, Globe, LogOut } from 'lucide-react';

export interface UserDropdownProps {
  nombre?: string;
  apellido?: string;
  email?: string;
  roles: string[];
  fotoUrl?: string | null;
  isDark: boolean;
  onCerrarSesion: () => void;
}

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

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

  const rolesApp = roles.filter((r) => ROLES_APP.includes(r));
  const rolesAMostrar = rolesApp.length > 0 ? rolesApp : roles;

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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
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

  const renderAvatar = (size = 32) => {
    if (fotoUrl) {
      return (
        <img
          src={fotoUrl}
          alt={`Foto de ${nombre || 'usuario'}`}
          className="rounded-circle border"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(12,12,12,0.15)',
            flexShrink: 0,
          }}
        />
      );
    }

    const iniN = (nombre || '').trim()[0] || '';
    const iniA = (apellido || '').trim()[0] || '';
    const iniciales = (iniN + iniA).toUpperCase() || 'U';

    return (
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: size <= 32 ? '0.72rem' : '0.85rem',
          backgroundColor: '#0071BC',
          color: '#FFFDFA',
          flexShrink: 0,
          letterSpacing: '0.04em',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,113,188,0.3)'}`,
        }}
        aria-hidden="true"
      >
        {iniciales}
      </div>
    );
  };

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
        {renderAvatar(32)}
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
              {renderAvatar(38)}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="fw-bold text-truncate"
                  style={{
                    fontSize: '0.925rem',
                    color: isDark ? '#FFFDFA' : '#0C0C0C',
                  }}
                >
                  {nombre} {apellido}
                </div>
                {email && (
                  <div className="text-muted small text-truncate" style={{ fontSize: '0.78rem' }}>
                    {email}
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {rolesAMostrar.map((rol) => (
                <span
                  key={rol}
                  className="dash-role-badge"
                  style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}
                >
                  {rol}
                </span>
              ))}
            </div>
          </div>

          <hr className="my-1 user-dropdown-divider" />

          {/* Opciones */}
          <Link
            to="/mi-perfil"
            role="menuitem"
            className="user-dropdown-item d-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded"
            onClick={closeDropdown}
          >
            <User size={16} strokeWidth={2} />
            <span>Mi Perfil</span>
          </Link>

          <Link
            to="/"
            role="menuitem"
            className="user-dropdown-item d-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded"
            onClick={closeDropdown}
          >
            <Globe size={16} strokeWidth={2} />
            <span>Sitio público</span>
          </Link>

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

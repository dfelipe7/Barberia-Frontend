import React, { useState, useRef, useEffect, useContext } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import {
  TEMAS_TENANT,
  type TenantThemeId,
  resolverTemaTenant,
  guardarTemaTenant,
} from '../../config/tenantTheme';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';
import { ToastContext } from '../ui/ToastContext';
import { useTheme } from '../context/ThemeContext';

interface TenantThemeSelectorProps {
  isDark?: boolean;
}

export const TenantThemeSelector: React.FC<TenantThemeSelectorProps> = ({ isDark: isDarkProp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toastCtx = useContext(ToastContext);
  const { isDark: isDarkContext } = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkContext;

  const slug = obtenerNegocioSlugActivo() || localStorage.getItem('negocio_slug') || 'barberia-demo-2';
  const [temaActual, setTemaActual] = useState<TenantThemeId>(() => resolverTemaTenant(slug));

  useEffect(() => {
    const tema = resolverTemaTenant(slug);
    setTemaActual(tema);
  }, [slug]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSeleccionarTema = (nuevoTemaId: TenantThemeId) => {
    guardarTemaTenant(slug, nuevoTemaId);
    setTemaActual(nuevoTemaId);
    setIsOpen(false);
    if (toastCtx?.showToast) {
      toastCtx.showToast('info', `Tema visual cambiado a: ${TEMAS_TENANT[nuevoTemaId].nombre}`);
    }
  };

  const configActual = TEMAS_TENANT[temaActual] || TEMAS_TENANT['clasico-azul'];
  const acentoBoton = temaActual === 'monochrome-noir' && !isDark ? '#000000' : configActual.colorPrimario;

  return (
    <div className="position-relative d-inline-block text-start" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`btn btn-sm ${
          isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'
        } d-inline-flex align-items-center gap-1.5 header-action-btn`}
        title={`Tema visual: ${configActual.nombre} (Clic para cambiar)`}
        aria-label="Cambiar tema visual de la barbería"
        aria-expanded={isOpen}
        style={{
          borderLeft: `3px solid ${acentoBoton}`,
          borderRadius: '9999px',
          padding: '0.25rem 0.65rem',
        }}
      >
        <Palette size={15} style={{ color: acentoBoton }} />
        <span className="d-none d-xl-inline fw-semibold" style={{ fontSize: '0.78rem' }}>
          {configActual.nombre.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 border rounded-4 shadow-lg p-2"
          style={{
            zIndex: 1070,
            minWidth: '290px',
            animation: 'fadeInMenu 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            backgroundColor: isDark ? '#141815' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
            boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.45)' : '0 16px 36px rgba(0, 0, 0, 0.12)',
            color: isDark ? '#f3f4f6' : '#1e293b',
          }}
        >
          {/* Header del dropdown */}
          <div className="px-3 pt-2 pb-2 border-bottom border-surface-subtle d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-1.5">
              <Sparkles size={14} className="text-warning" />
              <span className="fw-bold small" style={{ fontSize: '0.82rem', letterSpacing: '0.02em' }}>
                Temas de Barbería
              </span>
            </div>
            <span
              className="badge rounded-pill"
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: isDark ? '#9ca3af' : '#64748b',
              }}
            >
              Frontend Demo
            </span>
          </div>

          {/* Opciones de tema */}
          <div className="d-flex flex-column gap-1 pt-2">
            {(Object.keys(TEMAS_TENANT) as TenantThemeId[]).map((id) => {
              const tema = TEMAS_TENANT[id];
              const isSelected = temaActual === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSeleccionarTema(id)}
                  className={`btn btn-sm d-flex align-items-center justify-content-between text-start p-2 rounded-3 border-0 transition-all ${
                    isSelected ? 'fw-bold' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)'
                      : 'transparent',
                    color: isDark ? '#f3f4f6' : '#1e293b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    {/* Indicador de color y forma */}
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: tema.formaBotones === 'pill' ? '9999px' : '5px',
                        backgroundColor: id === 'monochrome-noir' && !isDark ? '#000000' : tema.colorPrimario,
                        boxShadow: `0 0 10px ${tema.glow}`,
                        flexShrink: 0,
                        border: isDark ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.3)',
                      }}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span style={{ fontSize: '0.84rem' }}>{tema.nombre}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{tema.badge}</span>
                      </div>
                      <span
                        className="d-block text-muted"
                        style={{ fontSize: '0.72rem', maxWidth: '200px', lineHeight: 1.2 }}
                      >
                        {tema.descripcion}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      size={16}
                      className="flex-shrink-0 ms-2"
                      style={{ color: tema.colorPrimario }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pie informativo */}
          <div
            className="mt-2 pt-2 border-top border-surface-subtle px-3 pb-1 text-muted"
            style={{ fontSize: '0.68rem', lineHeight: 1.3 }}
          >
            Se aplica al instante en tu sesión sin modificar la base de datos.
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantThemeSelector;


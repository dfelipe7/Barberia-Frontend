import React, { useState, useRef, useEffect, useContext } from 'react';
import { Palette, Check } from 'lucide-react';
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
  const [temaActual, setTemaActual] = useState<TenantThemeId>(() => {
    const attr = document.documentElement.dataset.tenantTheme as TenantThemeId;
    if (attr && TEMAS_TENANT[attr]) return attr;
    return resolverTemaTenant(slug);
  });

  useEffect(() => {
    const sincronizarTema = () => {
      const attr = document.documentElement.dataset.tenantTheme as TenantThemeId;
      if (attr && TEMAS_TENANT[attr]) {
        setTemaActual(attr);
      } else {
        setTemaActual(resolverTemaTenant(slug));
      }
    };

    sincronizarTema();

    window.addEventListener('tenant-tema-cambiado', sincronizarTema);
    window.addEventListener('tenant-perfil-actualizado', sincronizarTema);
    window.addEventListener('storage', sincronizarTema);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-tenant-theme') {
          sincronizarTema();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tenant-theme'] });

    return () => {
      window.removeEventListener('tenant-tema-cambiado', sincronizarTema);
      window.removeEventListener('tenant-perfil-actualizado', sincronizarTema);
      window.removeEventListener('storage', sincronizarTema);
      observer.disconnect();
    };
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
            minWidth: '240px',
            animation: 'fadeInMenu 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            backgroundColor: isDark ? '#141815' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
            boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.45)' : '0 16px 36px rgba(0, 0, 0, 0.12)',
            color: isDark ? '#f3f4f6' : '#1e293b',
          }}
        >
          {/* Header del dropdown */}
          <div className="px-2.5 pt-1.5 pb-2 border-bottom border-surface-subtle d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-1.5">
              <Palette size={14} style={{ color: acentoBoton }} />
              <span className="fw-bold small" style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>
                Tema Visual
              </span>
            </div>
            <span
              className="badge rounded-pill"
              style={{
                fontSize: '0.65rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? '#9ca3af' : '#64748b',
              }}
            >
              {Object.keys(TEMAS_TENANT).length} temas
            </span>
          </div>

          {/* Opciones de tema limpias (sin descripciones largas redundantes) */}
          <div className="d-flex flex-column gap-1 pt-1.5">
            {(Object.keys(TEMAS_TENANT) as TenantThemeId[]).map((id) => {
              const tema = TEMAS_TENANT[id];
              const isSelected = temaActual === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSeleccionarTema(id)}
                  className={`btn btn-sm w-100 d-flex align-items-center justify-content-between text-start px-2.5 py-1.5 rounded-3 border-0 transition-all ${
                    isSelected ? 'fw-bold' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.06)'
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
                  <div className="d-flex align-items-center gap-2.5 min-w-0">
                    {/* Indicador de color y forma */}
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: tema.formaBotones === 'pill' ? '9999px' : '4px',
                        backgroundColor: id === 'monochrome-noir' && !isDark ? '#000000' : tema.colorPrimario,
                        boxShadow: `0 0 8px ${tema.glow}`,
                        flexShrink: 0,
                        border: isDark ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid rgba(0,0,0,0.2)',
                      }}
                    />
                    <span style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                      {tema.nombre}
                    </span>
                  </div>

                  {isSelected && (
                    <Check
                      size={15}
                      className="flex-shrink-0 ms-2"
                      style={{ color: tema.colorPrimario }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pie limpio informativo */}
          <div
            className="mt-1.5 pt-1.5 border-top border-surface-subtle px-2 pb-0.5 text-center"
            style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b' }}
          >
            Personaliza más opciones en Configuración
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantThemeSelector;


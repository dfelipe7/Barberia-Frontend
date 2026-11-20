import React from 'react';
import { Palette, Check, Image as ImageIcon, Loader2, Upload, Trash2 } from 'lucide-react';
import type { PerfilNegocioGestionResponse, TipoRecursoPerfil } from '../types/perfilNegocio.types';
import { TEMAS_TENANT, type TenantThemeId } from '../../../config/tenantTheme';

interface TabDisenoYMarcaProps {
  perfil: PerfilNegocioGestionResponse | null;
  temaActual: TenantThemeId;
  onSeleccionarTema: (temaId: TenantThemeId) => void;
  subiendoRecurso: TipoRecursoPerfil | null;
  eliminandoRecurso: TipoRecursoPerfil | null;
  onSubirArchivo: (tipo: TipoRecursoPerfil, file: File) => void;
  onEliminarRecurso: (tipo: TipoRecursoPerfil) => void;
  inputBannerRef: React.RefObject<HTMLInputElement | null>;
  inputLogoBlancoRef: React.RefObject<HTMLInputElement | null>;
  inputLogoNegroRef: React.RefObject<HTMLInputElement | null>;
  inputFaviconRef: React.RefObject<HTMLInputElement | null>;
  resolverUrlRecurso: (url: string | null | undefined) => string | null;
}

export const TabDisenoYMarca: React.FC<TabDisenoYMarcaProps> = ({
  perfil,
  temaActual,
  onSeleccionarTema,
  subiendoRecurso,
  eliminandoRecurso,
  onSubirArchivo,
  onEliminarRecurso,
  inputBannerRef,
  inputLogoBlancoRef,
  inputLogoNegroRef,
  inputFaviconRef,
  resolverUrlRecurso,
}) => {
  return (
    <div className="d-flex flex-column gap-4">
      <div className="row g-4">
        <div className="col-12 col-xl-12">
          <div className="card shadow-sm border-0 card-surface mb-4">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Palette className="text-primary" size={20} />
                <h5 className="fw-bold mb-0">Paleta y Tema Visual</h5>
              </div>
              <p className="text-muted small mt-1 mb-0">
                Selecciona la personalidad visual de tu barbería. Se adapta tanto al modo claro como al modo oscuro.
              </p>
            </div>

            <div className="card-body p-4">
              <div className="d-flex flex-column gap-2">
                {(Object.keys(TEMAS_TENANT) as TenantThemeId[]).map((tId) => {
                  const cfg = TEMAS_TENANT[tId];
                  const esActivo = temaActual === tId;

                  return (
                    <button
                      key={tId}
                      type="button"
                      onClick={() => onSeleccionarTema(tId)}
                      className={`btn text-start p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                        esActivo
                          ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                          : 'border-secondary border-opacity-25 bg-body-tertiary hover-surface'
                      }`}
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span
                          className="rounded-circle shadow-sm d-inline-block"
                          style={{
                            width: 24,
                            height: 24,
                            backgroundColor: cfg.colorPrimario,
                            border: '2px solid rgba(255,255,255,0.7)',
                          }}
                        />
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold small">{cfg.nombre}</span>
                            <span className="badge bg-secondary bg-opacity-25 text-body" style={{ fontSize: '0.7rem' }}>
                              {cfg.badge}
                            </span>
                          </div>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            {cfg.descripcion}
                          </span>
                        </div>
                      </div>

                      {esActivo && (
                        <div className="text-primary">
                          <Check size={20} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card shadow-sm border-0 card-surface">
          <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
            <div className="d-flex align-items-center gap-2">
              <ImageIcon className="text-primary" size={20} />
              <h5 className="fw-bold mb-0">Identidad Visual y Archivos de Marca</h5>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Sube tus archivos oficiales. El sistema los valida, sanea y almacena de forma aislada para tu barbería.
            </p>
          </div>

          <div className="card-body p-4">
            <div className="row g-4">
              {/* 1. Banner Principal (PNG) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Banner Principal</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary">PNG (Máx 5MB)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Portada panorámica para la cabecera de la página de reservas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center overflow-hidden mb-3 bg-surface-app"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.bannerUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.bannerUrl)!}
                          alt="Banner de la barbería"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin banner personalizado</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputBannerRef}
                      accept="image/png"
                      className="d-none"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          onSubirArchivo('banner', archivo);
                        }
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'banner'}
                        onClick={() => inputBannerRef.current?.click()}
                      >
                        {subiendoRecurso === 'banner' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir PNG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.bannerUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar banner"
                          disabled={eliminandoRecurso === 'banner'}
                          onClick={() => onEliminarRecurso('banner')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Logo para Fondos Oscuros (SVG Blanco) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Logo Modo Oscuro</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Blanco)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Se muestra sobre fondos oscuros o barras de navegación nocturnas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3"
                      style={{ height: '140px', backgroundColor: '#18181b', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.logoBlancoUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.logoBlancoUrl)!}
                          alt="Logo para fondo oscuro"
                          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-white-50 p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin logo blanco</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputLogoBlancoRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          onSubirArchivo('logo-blanco', archivo);
                        }
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'logo-blanco'}
                        onClick={() => inputLogoBlancoRef.current?.click()}
                      >
                        {subiendoRecurso === 'logo-blanco' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.logoBlancoUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar logo blanco"
                          disabled={eliminandoRecurso === 'logo-blanco'}
                          onClick={() => onEliminarRecurso('logo-blanco')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Logo para Fondos Claros (SVG Negro) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Logo Modo Claro</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Negro)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Se muestra sobre fondos claros, tickets y cabeceras blancas.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3 bg-white"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.logoNegroUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.logoNegroUrl)!}
                          alt="Logo para fondo claro"
                          style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin logo negro</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputLogoNegroRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          onSubirArchivo('logo-negro', archivo);
                        }
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'logo-negro'}
                        onClick={() => inputLogoNegroRef.current?.click()}
                      >
                        {subiendoRecurso === 'logo-negro' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.logoNegroUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar logo negro"
                          disabled={eliminandoRecurso === 'logo-negro'}
                          onClick={() => onEliminarRecurso('logo-negro')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Favicon (SVG) */}
              <div className="col-12 col-md-6 col-lg-3">
                <div className="p-3 border rounded-3 bg-body-tertiary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold small">Favicon del Sitio</span>
                      <span className="badge bg-secondary bg-opacity-25 text-body">SVG (Icono)</span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                      Icono visual que identifica la pestaña del navegador de los clientes.
                    </p>

                    <div
                      className="rounded-3 border border-dashed d-flex align-items-center justify-content-center p-3 mb-3 bg-surface-app"
                      style={{ height: '140px', position: 'relative' }}
                    >
                      {resolverUrlRecurso(perfil?.referenciasArchivo?.faviconUrl) ? (
                        <img
                          src={resolverUrlRecurso(perfil?.referenciasArchivo?.faviconUrl)!}
                          alt="Favicon de la barbería"
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-2">
                          <ImageIcon size={32} className="opacity-50 mb-1" />
                          <div style={{ fontSize: '0.75rem' }}>Sin favicon personalizado</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={inputFaviconRef}
                      accept=".svg,image/svg+xml"
                      className="d-none"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          onSubirArchivo('favicon', archivo);
                        }
                      }}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={subiendoRecurso === 'favicon'}
                        onClick={() => inputFaviconRef.current?.click()}
                      >
                        {subiendoRecurso === 'favicon' ? (
                          <Loader2 size={14} className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <Upload size={14} /> Subir SVG
                          </>
                        )}
                      </button>

                      {perfil?.referenciasArchivo?.faviconUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Eliminar favicon"
                          disabled={eliminandoRecurso === 'favicon'}
                          onClick={() => onEliminarRecurso('favicon')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


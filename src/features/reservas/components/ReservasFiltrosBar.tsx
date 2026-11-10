import { RotateCcw, Scissors } from 'lucide-react';
import type { EstadoReservaDTO } from '../api/reservas.dto';
import Button from '../../../shared/ui/Button';

export interface ReservasFiltrosBarProps {
  rango: string;
  barberoSeleccionadoNombre?: string | null;
  presetActivo: 'hoy' | 'semana' | 'mes' | null;
  aplicarPresetFecha: (preset: 'hoy' | 'semana' | 'mes') => void;
  hayFiltrosModificados: boolean;
  restablecerFiltros: () => void;
  desde: string;
  setDesde: (val: string) => void;
  hasta: string;
  setHasta: (val: string) => void;
  estado: EstadoReservaDTO | '';
  setEstado: (val: EstadoReservaDTO | '') => void;
  estados: Record<EstadoReservaDTO, string>;
  barberoId: string;
  setBarberoId: (val: string) => void;
  barberosOrdenados: Array<{ id: number; nombre: string; apellido: string }>;
  filtroInvalido: boolean;
  aplicarFiltros: () => void;
}

export default function ReservasFiltrosBar({
  rango,
  barberoSeleccionadoNombre,
  presetActivo,
  aplicarPresetFecha,
  hayFiltrosModificados,
  restablecerFiltros,
  desde,
  setDesde,
  hasta,
  setHasta,
  estado,
  setEstado,
  estados,
  barberoId,
  setBarberoId,
  barberosOrdenados,
  filtroInvalido,
  aplicarFiltros,
}: ReservasFiltrosBarProps) {
  return (
    <section className="card card-surface border-0 shadow-sm mb-4 reservations-admin__filters-card">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Filtrar reservas</h2>
            <p className="small text-surface-muted mb-0 d-flex align-items-center gap-2 flex-wrap">
              <span>Mostrando: <strong className="text-surface-primary">{rango}</strong></span>
              {barberoSeleccionadoNombre && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1">
                  <Scissors size={11} aria-hidden="true" /> {barberoSeleccionadoNombre}
                </span>
              )}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="reservations-admin__presets-group" role="group" aria-label="Periodos rápidos">
              <button
                type="button"
                className={`reservations-admin__preset-btn ${presetActivo === 'hoy' ? 'is-active' : ''}`}
                onClick={() => aplicarPresetFecha('hoy')}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`reservations-admin__preset-btn ${presetActivo === 'semana' ? 'is-active' : ''}`}
                onClick={() => aplicarPresetFecha('semana')}
              >
                Esta semana
              </button>
              <button
                type="button"
                className={`reservations-admin__preset-btn ${presetActivo === 'mes' ? 'is-active' : ''}`}
                onClick={() => aplicarPresetFecha('mes')}
              >
                Próximos 30 días
              </button>
            </div>

            {hayFiltrosModificados && (
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none text-surface-muted reservations-admin__reset-link d-inline-flex align-items-center gap-1 p-1"
                onClick={restablecerFiltros}
                title="Restablecer filtros a la vista por defecto (esta semana)"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span style={{ fontSize: '0.8rem' }}>Restablecer</span>
              </button>
            )}
          </div>
        </div>
        <div className="row g-2 g-md-3 align-items-end">
          <div className="col-12 col-sm-6 col-md-4 col-xxl-2">
            <label className="form-label" htmlFor="admin-reservas-desde">Desde</label>
            <input
              id="admin-reservas-desde"
              type="date"
              className="form-control"
              value={desde}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  // Fallback
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                  e.preventDefault();
                }
              }}
              onChange={(event) => setDesde(event.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-xxl-2">
            <label className="form-label" htmlFor="admin-reservas-hasta">Hasta</label>
            <input
              id="admin-reservas-hasta"
              type="date"
              className="form-control"
              value={hasta}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  // Fallback
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                  e.preventDefault();
                }
              }}
              onChange={(event) => setHasta(event.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6 col-md-4 col-xxl-2">
            <label className="form-label" htmlFor="admin-reservas-estado">Estado</label>
            <select
              id="admin-reservas-estado"
              className="form-select"
              value={estado}
              onChange={(event) => setEstado(event.target.value as EstadoReservaDTO | '')}
            >
              <option value="">Todos</option>
              {(Object.entries(estados) as [EstadoReservaDTO, string][]).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-md-8 col-xxl-4">
            <label className="form-label" htmlFor="admin-reservas-barbero">Barbero</label>
            <select
              id="admin-reservas-barbero"
              className="form-select"
              value={barberoId}
              onChange={(event) => setBarberoId(event.target.value)}
            >
              <option value="">Todos los barberos</option>
              {barberosOrdenados.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} {b.apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-12 col-md-4 col-xxl-2">
            <Button
              type="button"
              className="w-100 reservations-admin__filters-btn"
              disabled={filtroInvalido}
              onClick={aplicarFiltros}
            >
              Aplicar
            </Button>
            {hayFiltrosModificados && (
              <div className="text-center mt-1">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none text-surface-muted reservations-admin__reset-link p-0 d-inline-flex align-items-center gap-1"
                  onClick={restablecerFiltros}
                  title="Restablecer filtros a la vista por defecto (esta semana)"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span style={{ fontSize: '0.78rem' }}>Restablecer</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {filtroInvalido && <p className="small text-danger mt-2 mb-0">Revisa las fechas seleccionadas.</p>}
      </div>
    </section>
  );
}


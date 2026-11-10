import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  User,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ReservaClienteDTO } from '../api/reservas.dto';

export interface HistorialCitasClienteProps {
  citas: ReservaClienteDTO[];
  slugActivo: string;
  formatearFecha: (fecha: string) => string;
  formatearPrecio: (precio: number) => string;
  mapearEstado: (estado: string) => string;
}

const ITEMS_POR_PAGINA = 5;

type FiltroEstadoKey = 'TODAS' | 'COMPLETED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

const ETIQUETAS_FILTROS: Record<FiltroEstadoKey, string> = {
  TODAS: 'Todas',
  COMPLETED: 'Completadas',
  CONFIRMED: 'Confirmadas',
  CANCELLED: 'Canceladas',
  NO_SHOW: 'No asistió',
};

export const HistorialCitasCliente: React.FC<HistorialCitasClienteProps> = ({
  citas,
  slugActivo,
  formatearFecha,
  formatearPrecio,
  mapearEstado,
}) => {
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstadoKey>('TODAS');
  const [paginaActual, setPaginaActual] = useState(1);

  // Contadores dinámicos por estado para las píldoras de filtro
  const contadores = useMemo(() => {
    const counts: Record<FiltroEstadoKey, number> = {
      TODAS: citas.length,
      COMPLETED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };
    for (const c of citas) {
      if (counts[c.estado as FiltroEstadoKey] !== undefined) {
        counts[c.estado as FiltroEstadoKey]++;
      }
    }
    return counts;
  }, [citas]);

  // Lista de filtros disponibles (solo mostrar los que tengan al menos 1 cita, más 'TODAS')
  const filtrosDisponibles = useMemo(() => {
    const claves: FiltroEstadoKey[] = ['TODAS', 'COMPLETED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'];
    return claves.filter((clave) => clave === 'TODAS' || contadores[clave] > 0);
  }, [contadores]);

  // Filtrado de citas según el filtro seleccionado
  const citasFiltradas = useMemo(() => {
    if (filtroActivo === 'TODAS') return citas;
    return citas.filter((c) => c.estado === filtroActivo);
  }, [citas, filtroActivo]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(citasFiltradas.length / ITEMS_POR_PAGINA));
  const paginaEfectiva = Math.min(paginaActual, totalPaginas);

  const citasPaginadas = useMemo(() => {
    const inicio = (paginaEfectiva - 1) * ITEMS_POR_PAGINA;
    return citasFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [citasFiltradas, paginaEfectiva]);

  const indiceInicio = citasFiltradas.length === 0 ? 0 : (paginaEfectiva - 1) * ITEMS_POR_PAGINA + 1;
  const indiceFin = Math.min(paginaEfectiva * ITEMS_POR_PAGINA, citasFiltradas.length);

  const cambiarFiltro = (nuevoFiltro: FiltroEstadoKey) => {
    setFiltroActivo(nuevoFiltro);
    setPaginaActual(1);
  };

  const irAPagina = (nuevaPagina: number) => {
    setPaginaActual(Math.max(1, Math.min(nuevaPagina, totalPaginas)));
  };

  if (citas.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h3 className="h6 fw-bold text-muted text-uppercase tracking-wider mb-0">
          Historial de Citas Anteriores
        </h3>
        <span className="small text-muted">
          {citas.length} {citas.length === 1 ? 'cita registrada' : 'citas registradas'}
        </span>
      </div>

      {/* Barra de Filtros Rápidos (Pills) */}
      {filtrosDisponibles.length > 2 && (
        <div className="historial-pills-bar" role="tablist" aria-label="Filtrar citas por estado">
          {filtrosDisponibles.map((clave) => {
            const count = contadores[clave];
            const activa = filtroActivo === clave;
            return (
              <button
                key={clave}
                type="button"
                role="tab"
                aria-selected={activa}
                className={`historial-pill-btn ${activa ? 'is-active' : ''}`}
                onClick={() => cambiarFiltro(clave)}
              >
                <span>{ETIQUETAS_FILTROS[clave]}</span>
                <span className="historial-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Filas Compactas */}
      {citasPaginadas.length === 0 ? (
        <div className="historial-empty-filter p-4 text-center rounded-3">
          <p className="text-muted small mb-0">No se encontraron citas con este filtro.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {citasPaginadas.map((reserva) => {
            const rutaReagendar = slugActivo
              ? `/${slugActivo}/reservar?servicio=${reserva.servicio.id}&barbero=${reserva.barbero.id}`
              : `/reservar?servicio=${reserva.servicio.id}&barbero=${reserva.barbero.id}`;

            const permiteReagendar = reserva.estado === 'COMPLETED' || reserva.estado === 'CONFIRMED';

            return (
              <div key={reserva.id} className="historial-row-card">
                {/* Columna Izquierda: Información de la Cita */}
                <div className="historial-row__info">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1.5">
                    <span className={`cliente-ticket__badge-status badge-status--${reserva.estado}`}>
                      {mapearEstado(reserva.estado)}
                    </span>
                    <span className="small font-monospace text-muted">#{reserva.id}</span>
                    <span className="historial-row__bullet" aria-hidden="true">•</span>
                    <span className="small text-muted d-inline-flex align-items-center gap-1">
                      <Calendar size={13} className="text-muted flex-shrink-0" />
                      <span className="text-capitalize">{formatearFecha(reserva.fecha)}</span>
                      <span className="ms-1 fw-bold text-portal-fg">{reserva.hora}</span>
                    </span>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-x-3 gap-y-1">
                    <div className="d-inline-flex align-items-center gap-1.5 fw-bold text-portal-fg">
                      <Scissors size={14} className="historial-row__icon-service" />
                      <span>{reserva.servicio.nombre}</span>
                    </div>
                    <div className="small text-muted d-inline-flex align-items-center gap-1">
                      <User size={13} className="flex-shrink-0" />
                      <span>{reserva.barbero.nombre} {reserva.barbero.apellido}</span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Precio y Acción Rápida */}
                <div className="historial-row__action">
                  <span className="historial-row__price">
                    {formatearPrecio(reserva.precio)}
                  </span>

                  {permiteReagendar && (
                    <Link
                      to={rutaReagendar}
                      className="historial-rebook-btn"
                      title="Volver a agendar este mismo corte con tu barbero"
                    >
                      <RotateCcw size={12} />
                      <span>Repetir corte</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación Inferior */}
      {totalPaginas > 1 && (
        <div className="historial-pagination">
          <div className="small text-muted">
            Mostrando <strong>{indiceInicio}–{indiceFin}</strong> de <strong>{citasFiltradas.length}</strong> citas
          </div>

          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              className="historial-page-btn"
              onClick={() => irAPagina(paginaEfectiva - 1)}
              disabled={paginaEfectiva <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={14} />
              <span className="d-none d-sm-inline">Anterior</span>
            </button>

            {/* Selector o Píldoras de Páginas */}
            <div className="d-flex align-items-center gap-1 px-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                const esActiva = num === paginaEfectiva;
                return (
                  <button
                    key={num}
                    type="button"
                    className={`historial-page-num ${esActiva ? 'is-active' : ''}`}
                    onClick={() => irAPagina(num)}
                    aria-current={esActiva ? 'page' : undefined}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="historial-page-btn"
              onClick={() => irAPagina(paginaEfectiva + 1)}
              disabled={paginaEfectiva >= totalPaginas}
              aria-label="Página siguiente"
            >
              <span className="d-none d-sm-inline">Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

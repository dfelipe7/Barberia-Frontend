import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { PasoReserva } from './BookingStepper';
import type { Servicio } from '../../servicios/types/servicios.types';
import type { BarberoDisponibleReservaDTO } from '../api/reservas.dto';
import Button from '../../../shared/ui/Button';

export interface BookingFloatingBarProps {
  paso: PasoReserva;
  servicioSeleccionado?: Servicio | null;
  barberoSeleccionado?: BarberoDisponibleReservaDTO | null;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
  barberoFijoId?: number | null;
  reservaCreada: boolean;
  reservaModificada: boolean;
  formatearPrecio: (precio: number) => string;
  formatearFecha: (fechaIso: string) => string;
  continuarDesdeServicio: () => void;
  continuarDesdeBarbero: () => void;
  irAPaso: (pasoDestino: PasoReserva) => void;
}

export const BookingFloatingBar: React.FC<BookingFloatingBarProps> = ({
  paso,
  servicioSeleccionado,
  barberoSeleccionado,
  fechaSeleccionada,
  horaSeleccionada,
  barberoFijoId,
  reservaCreada,
  reservaModificada,
  formatearPrecio,
  formatearFecha,
  continuarDesdeServicio,
  continuarDesdeBarbero,
  irAPaso,
}) => {
  return (
    <>
      {/* Barra flotante inferior de acción continua */}
      {paso === 1 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 1 · Servicio</span>
              <div className="d-flex align-items-center gap-2">
                <strong className="booking-floating-bar__title">
                  {servicioSeleccionado ? servicioSeleccionado.nombre : 'Elige un servicio para continuar'}
                </strong>
                {servicioSeleccionado && (
                  <span className="badge booking-primary-badge">
                    {formatearPrecio(servicioSeleccionado.precio)}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!servicioSeleccionado}
              onClick={continuarDesdeServicio}
              icon={<ChevronRight size={18} />}
            >
              {barberoFijoId ? 'Elegir fecha y hora' : 'Elegir barbero'}
            </Button>
          </div>
        </aside>
      )}

      {paso === 2 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 2 · Barbero</span>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <strong className="booking-floating-bar__title">
                  {servicioSeleccionado?.nombre}
                </strong>
                <span className="text-surface-muted">·</span>
                <span className="text-primary fw-semibold">
                  {barberoSeleccionado ? `${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}` : 'Elige tu barbero'}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!barberoSeleccionado}
              onClick={continuarDesdeBarbero}
              icon={<ChevronRight size={18} />}
            >
              Elegir fecha y hora
            </Button>
          </div>
        </aside>
      )}

      {paso === 3 && (
        <aside className="booking-floating-bar" aria-label="Resumen y avance">
          <div className="booking-floating-bar__content">
            <div className="booking-floating-bar__info">
              <span className="booking-floating-bar__tag">Paso 3 · Agenda</span>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <strong className="booking-floating-bar__title">
                  {fechaSeleccionada ? formatearFecha(fechaSeleccionada) : 'Selecciona una fecha'}
                </strong>
                {horaSeleccionada && (
                  <>
                    <span className="text-surface-muted">·</span>
                    <span className="badge booking-primary-badge">{horaSeleccionada}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="booking-floating-bar__btn"
              disabled={!fechaSeleccionada || !horaSeleccionada}
              onClick={() => irAPaso(4)}
              icon={<ChevronRight size={18} />}
            >
              Continuar al resumen
            </Button>
          </div>
        </aside>
      )}

      {paso > 1 && !reservaCreada && !reservaModificada && (
        <div className="mt-4 pt-3 border-top small text-surface-muted">
          <span className="fw-semibold">Tu selección:</span>{' '}
          {servicioSeleccionado?.nombre ?? 'elige un servicio'}
          {barberoSeleccionado ? ' · ' + barberoSeleccionado.nombre + ' ' + barberoSeleccionado.apellido : ''}
          {fechaSeleccionada ? ' · ' + formatearFecha(fechaSeleccionada) : ''}
          {horaSeleccionada ? ' · ' + horaSeleccionada : ''}
        </div>
      )}
    </>
  );
};

export default BookingFloatingBar;

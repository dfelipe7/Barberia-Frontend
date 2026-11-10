import React from 'react';
import { Scissors, UserRound, CalendarDays, Check } from 'lucide-react';

export type PasoReserva = 1 | 2 | 3 | 4;

export interface BookingStepperProps {
  paso: PasoReserva;
  barberoFijoId?: number | null;
  reservaCreada: boolean;
  reservaModificada: boolean;
  irAPaso: (pasoDestino: PasoReserva, resetearDesdeDestino?: boolean, estadoAdicional?: Record<string, string | null>) => void;
}

export const BookingStepper: React.FC<BookingStepperProps> = ({
  paso,
  barberoFijoId,
  reservaCreada,
  reservaModificada,
  irAPaso,
}) => {
  return (
    <nav aria-label="Pasos de la reserva" className="mb-4 booking-stepper-container">
      <div className="booking-stepper-segments" aria-hidden="true">
        <div className={`booking-stepper-segment ${paso >= 1 ? 'is-active' : ''}`} />
        <div className={`booking-stepper-segment ${paso >= 2 || Boolean(barberoFijoId) ? 'is-active' : ''}`} />
        <div className={`booking-stepper-segment ${paso >= 3 ? 'is-active' : ''}`} />
        <div className={`booking-stepper-segment ${paso >= 4 ? 'is-active' : ''}`} />
      </div>

      <ol className="booking-stepper list-unstyled d-flex justify-content-between mb-0">
        {[
          { numero: 1, label: 'Servicio', icono: <Scissors size={15} /> },
          { numero: 2, label: 'Barbero', icono: <UserRound size={15} /> },
          { numero: 3, label: 'Fecha y hora', icono: <CalendarDays size={15} /> },
          { numero: 4, label: reservaCreada || reservaModificada ? 'Confirmada' : 'Confirmar', icono: <Check size={15} /> },
        ].map((item) => {
          const pasoItem = item.numero as PasoReserva;
          const estaCompletado =
            paso > item.numero ||
            (item.numero === 2 && Boolean(barberoFijoId)) ||
            (item.numero === 4 && Boolean(reservaCreada || reservaModificada));
          const esActual = paso === item.numero;
          const habilitado =
            !reservaCreada &&
            !reservaModificada &&
            (item.numero <= paso || (item.numero === 2 && Boolean(barberoFijoId)));

          let claseEstado = '';
          if (esActual) {
            claseEstado = 'is-current';
          } else if (estaCompletado) {
            claseEstado = 'is-done';
          }

          return (
            <li key={item.numero} className="booking-stepper__item">
              <button
                type="button"
                className={`booking-stepper__step ${claseEstado}`.trim()}
                aria-current={esActual ? 'step' : undefined}
                disabled={!habilitado}
                onClick={() => {
                  if (pasoItem === 1) {
                    if (!barberoFijoId) {
                      irAPaso(1, false, { barberoId: null });
                    } else {
                      irAPaso(1);
                    }
                  } else if (pasoItem === 2) {
                    irAPaso(2);
                  } else if (pasoItem === 3) {
                    irAPaso(3);
                  } else if (pasoItem === 4) {
                    irAPaso(4);
                  }
                }}
              >
                <span className="booking-stepper__icon-wrap">
                  {estaCompletado && !esActual ? (
                    <Check size={14} className="booking-stepper__check" />
                  ) : (
                    item.icono
                  )}
                </span>
                <span className="booking-stepper__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BookingStepper;

import React, { useState } from 'react';
import { Clock, X, MessageCircle } from 'lucide-react';

export interface ReservaEnProcesoAlertProps {
  servicioNombre?: string;
  barberoNombre?: string;
  onClose: () => void;
  onIrAServicios?: () => void;
  onIrABarberos?: () => void;
}

export const ReservaEnProcesoAlert: React.FC<ReservaEnProcesoAlertProps> = ({
  servicioNombre,
  barberoNombre,
  onClose,
  onIrAServicios,
  onIrABarberos,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  // Construcción del mensaje predefinido para WhatsApp
  const mensajeWhatsapp = encodeURIComponent(
    `¡Hola Kyrios Studio! Quiero agendar una cita.${
      servicioNombre ? ` Servicio: ${servicioNombre}.` : ''
    }${barberoNombre ? ` Barbero: ${barberoNombre}.` : ''} ¿Qué disponibilidad tienen?`
  );

  const whatsappUrl = `https://wa.me/573100000000?text=${mensajeWhatsapp}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`reserva-en-proceso-card rounded-2 shadow-sm p-3 p-md-4 position-relative ${
        isExiting ? 'reserva-alert-exiting' : 'reserva-alert-animating'
      }`}
      style={{
        background: 'var(--home-surface)',
        border: '1px solid rgba(0, 113, 188, 0.25)',
        borderLeft: '4px solid #0071BC',
      }}
    >
      {/* Botón X de cierre */}
      <button
        type="button"
        className="btn btn-sm btn-link position-absolute top-0 end-0 m-2 p-1 text-decoration-none"
        onClick={handleClose}
        aria-label="Cerrar advertencia de reserva"
        style={{ color: 'var(--home-fg-muted)', opacity: 0.8 }}
      >
        <X size={18} />
      </button>

      <div className="d-flex flex-column flex-md-row align-items-start gap-3 pe-4">
        {/* Ícono de reloj en azul de marca */}
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: '42px',
            height: '42px',
            backgroundColor: 'rgba(0, 113, 188, 0.15)',
            color: '#0071BC',
          }}
        >
          <Clock size={22} strokeWidth={2.2} />
        </div>

        {/* Contenido textual */}
        <div className="flex-grow-1">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <h4
              className="mb-0 fw-bold font-display"
              style={{ fontSize: '1.05rem', color: 'var(--home-fg)', letterSpacing: '0.02em' }}
            >
              Reserva en proceso
            </h4>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(0, 113, 188, 0.15)',
                color: '#0071BC',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Próximo lanzamiento
            </span>
          </div>

          <p className="mb-2 small" style={{ color: 'var(--home-fg-muted)', lineHeight: 1.55 }}>
            Tu selección fue registrada. El sistema de reservas en línea estará disponible muy pronto. Mientras tanto, contáctanos para confirmar tu cita.
          </p>

          {/* Resumen de selección */}
          {(servicioNombre || barberoNombre) && (
            <div
              className="d-flex flex-wrap align-items-center gap-2 mb-3 py-1 px-2 rounded border"
              style={{
                backgroundColor: 'var(--home-surface-alt)',
                borderColor: 'var(--home-surface-border)',
              }}
            >
              <span className="small fw-semibold" style={{ color: 'var(--home-fg-muted)' }}>Selección actual:</span>
              {servicioNombre && (
                <span className="badge bg-dark text-white fw-medium">
                  Servicio: {servicioNombre}
                </span>
              )}
              {barberoNombre && (
                <span
                  className="badge text-white fw-medium"
                  style={{ backgroundColor: '#0071BC' }}
                >
                  Barbero: {barberoNombre}
                </span>
              )}
              {servicioNombre && !barberoNombre && onIrABarberos && (
                <button
                  type="button"
                  onClick={onIrABarberos}
                  className="btn btn-sm btn-link p-0 text-decoration-none small fw-semibold ms-auto"
                  style={{ color: '#0071BC', fontSize: '0.8rem' }}
                >
                  + Elegir barbero ↓
                </button>
              )}
              {barberoNombre && !servicioNombre && onIrAServicios && (
                <button
                  type="button"
                  onClick={onIrAServicios}
                  className="btn btn-sm btn-link p-0 text-decoration-none small fw-semibold ms-auto"
                  style={{ color: '#0071BC', fontSize: '0.8rem' }}
                >
                  + Elegir servicio ↑
                </button>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex flex-wrap align-items-center gap-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm d-inline-flex align-items-center gap-2 text-white fw-semibold px-3 py-2"
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                borderRadius: '4px',
              }}
            >
              <MessageCircle size={16} />
              <span>Contactar por WhatsApp</span>
            </a>

            <button
              type="button"
              className="btn-kyrios-dark px-3 py-1"
              onClick={handleClose}
              style={{ borderRadius: '4px', fontSize: '0.82rem' }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaEnProcesoAlert;

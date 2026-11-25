import React, { useState, useEffect, useContext } from 'react';
import {
  Clock,
  UserCheck,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { politicasReservaApi } from '../services/politicasReservaApi';
import type { PoliticasReserva } from '../types/politicasReserva.types';
import { ToastContext } from '../../../shared/ui/ToastContext';

const OPCIONES_CITAS_DIARIAS = [
  { valor: 1, label: '1 cita' },
  { valor: 2, label: '2 citas' },
  { valor: 3, label: '3 citas' },
  { valor: 4, label: '4 citas' },
  { valor: 5, label: '5 citas' },
];

const PRESETS_CANCELACION = [
  { minutos: 60, texto: '1 hora' },
  { minutos: 120, texto: '2 horas' },
  { minutos: 240, texto: '4 horas' },
  { minutos: 1440, texto: '24 horas' },
];

const PRESETS_NO_SHOW = [
  { minutos: 10, texto: '10 min' },
  { minutos: 15, texto: '15 min' },
  { minutos: 20, texto: '20 min' },
  { minutos: 30, texto: '30 min' },
];

/**
 * Calcula una conversión humana limpia a horas o días ÚNICAMENTE cuando
 * los minutos son 60 o más. Si son menos de 60 minutos devuelve `null`
 * para evitar redundancias absurdas como "Equivale a 48 min".
 */
function obtenerEquivalenciaHoras(minutos: number): string | null {
  if (!minutos || minutos < 60) return null;
  const horas = Math.floor(minutos / 60);
  const restoMin = minutos % 60;

  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const restoHoras = horas % 24;
    if (restoHoras === 0 && restoMin === 0) {
      return `≈ ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
    if (restoMin === 0) {
      return `≈ ${dias}d ${restoHoras}h`;
    }
    return `≈ ${dias}d ${restoHoras}h ${restoMin}m`;
  }

  if (restoMin === 0) {
    return `≈ ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }
  return `≈ ${horas} h ${restoMin} min`;
}

function extraerMensajeError(err: unknown): string {
  if (err && typeof err === 'object') {
    const axiosErr = err as { response?: { data?: { message?: string | string[] } }; message?: string };
    const apiMsg = axiosErr.response?.data?.message;
    if (Array.isArray(apiMsg) && apiMsg.length > 0) return apiMsg[0];
    if (typeof apiMsg === 'string') return apiMsg;
    if (axiosErr.message) return axiosErr.message;
  }
  return 'Error al guardar las políticas';
}

export const TabPoliticasReserva: React.FC = () => {
  const toastContext = useContext(ToastContext);

  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [cancelacionMinutos, setCancelacionMinutos] = useState<number>(120);
  const [noShowMinutos, setNoShowMinutos] = useState<number>(15);
  const [maxCitasDiarias, setMaxCitasDiarias] = useState<number>(3);

  useEffect(() => {
    let montado = true;

    async function cargarPoliticas() {
      try {
        setCargando(true);
        setError(null);
        const politicas = await politicasReservaApi.obtenerPoliticas();
        if (montado) {
          setCancelacionMinutos(politicas.reservaCancelacionAntelacionMinutos);
          setNoShowMinutos(politicas.reservaNoShowToleranciaMinutos);
          setMaxCitasDiarias(politicas.reservaMaxCitasDiariasCliente);
        }
      } catch (err: unknown) {
        if (montado) {
          const mensaje = extraerMensajeError(err);
          setError(mensaje);
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    cargarPoliticas().catch(() => {});

    return () => {
      montado = false;
    };
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setError(null);
      setExito(null);

      const payload: PoliticasReserva = {
        reservaCancelacionAntelacionMinutos: Math.max(1, Number(cancelacionMinutos) || 120),
        reservaNoShowToleranciaMinutos: Math.max(1, Number(noShowMinutos) || 15),
        reservaMaxCitasDiariasCliente: Math.max(1, Number(maxCitasDiarias) || 3),
      };

      await politicasReservaApi.actualizarPoliticas(payload);
      const mensajeExito = 'Políticas operativas guardadas exitosamente.';
      setExito(mensajeExito);

      // Notificación flotante estándar de la plataforma (Toast)
      toastContext?.showToast('success', mensajeExito);

      setTimeout(() => setExito(null), 6000);
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err);
      setError(mensaje);
      toastContext?.showToast('danger', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const equivCancelacion = obtenerEquivalenciaHoras(cancelacionMinutos);
  const equivNoShow = obtenerEquivalenciaHoras(noShowMinutos);

  if (cargando) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 card-surface rounded-4 border shadow-sm">
        <Loader2 className="animate-spin text-primary mb-3" size={32} />
        <span className="text-body fw-semibold">Cargando políticas operativas de la barbería...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleGuardar} className="d-flex flex-column gap-3">
      {/* Estilos para eliminar las flechas nativas apretadas de type=number */}
      <style>{`
        .politicas-number-input::-webkit-outer-spin-button,
        .politicas-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .politicas-number-input {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>

      {/* Alertas en la parte superior */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 shadow-sm rounded-3 py-2 px-3" role="alert">
          <AlertTriangle className="text-danger flex-shrink-0" size={18} />
          <span className="small fw-medium">{error}</span>
        </div>
      )}

      {exito && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-0 shadow-sm rounded-3 py-2 px-3" role="alert">
          <CheckCircle2 className="text-success flex-shrink-0" size={18} />
          <span className="small fw-semibold">{exito}</span>
        </div>
      )}

      <div className="card shadow-sm border-0 card-surface rounded-4 overflow-hidden">
        {/* Cabecera Principal */}
        <div className="card-header bg-transparent border-bottom p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="p-3 rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ backgroundColor: 'var(--bs-primary-bg-subtle, rgba(13, 110, 253, 0.12))' }}
            >
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <div>
              <h5 className="fw-bold mb-1">Políticas y Reglas de Agendamiento Online</h5>
              <p className="text-muted small mb-0">
                Configura los límites diarios de reservas, tiempos de cancelación y tolerancia de espera en la barbería.
              </p>
            </div>
          </div>
        </div>

        <div className="card-body p-4 p-md-4 d-flex flex-column gap-4">
          {/* SECCIÓN 1: Límite Diario de Reservas */}
          <div className="row g-3 align-items-start">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-2 rounded-2 bg-primary bg-opacity-10 text-primary">
                  <UserCheck size={18} />
                </div>
                <label htmlFor="maxCitasDiarias" className="fw-bold mb-0 text-body">
                  Máximo de citas por cliente al día
                </label>
              </div>
              <p className="text-muted small mb-0 ps-md-4 ms-md-2">
                Límite de citas activas que un mismo cliente puede reservar para una misma fecha.
              </p>
            </div>

            <div className="col-12 col-md-7">
              {/* Opciones rápidas */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                {OPCIONES_CITAS_DIARIAS.map((opt) => {
                  const seleccionado = maxCitasDiarias === opt.valor;
                  return (
                    <button
                      key={opt.valor}
                      type="button"
                      onClick={() => setMaxCitasDiarias(opt.valor)}
                      className={`btn btn-sm px-3 py-1 rounded-pill border d-inline-flex align-items-center gap-1 transition-all ${
                        seleccionado
                          ? 'btn-primary shadow-sm fw-semibold border-primary'
                          : 'btn-outline-secondary border-opacity-50 text-body bg-body'
                      }`}
                    >
                      {seleccionado && <Check size={13} strokeWidth={3} />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input manual */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="text-muted small">O escribe la cantidad exacta:</span>
                <div className="input-group" style={{ width: '150px' }}>
                  <input
                    id="maxCitasDiarias"
                    aria-label="Máximo de citas por cliente al día"
                    type="number"
                    min={1}
                    max={10}
                    className="form-control text-center fw-bold politicas-number-input"
                    value={maxCitasDiarias}
                    onChange={(e) => setMaxCitasDiarias(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  />
                  <span className="input-group-text small">citas</span>
                </div>
              </div>
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                💡 Si tus clientes agendan para grupos familiares o amigos, puedes escribir un valor mayor (hasta 10 citas).
              </small>
            </div>
          </div>

          <hr className="my-0 opacity-25" />

          {/* SECCIÓN 2: Antelación Mínima para Cancelar */}
          <div className="row g-3 align-items-start">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-2 rounded-2 bg-warning bg-opacity-10 text-warning-emphasis">
                  <Clock size={18} />
                </div>
                <label htmlFor="cancelacionMinutos" className="fw-bold mb-0 text-body">
                  Antelación mínima para cancelar
                </label>
              </div>
              <p className="text-muted small mb-0 ps-md-4 ms-md-2">
                Tiempo mínimo de anticipación requerido para que el cliente cancele desde la web.
              </p>
            </div>

            <div className="col-12 col-md-7">
              {/* Opciones rápidas */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                {PRESETS_CANCELACION.map((preset) => {
                  const seleccionado = cancelacionMinutos === preset.minutos;
                  return (
                    <button
                      key={preset.minutos}
                      type="button"
                      onClick={() => setCancelacionMinutos(preset.minutos)}
                      className={`btn btn-sm px-3 py-1 rounded-pill border d-inline-flex align-items-center gap-1 transition-all ${
                        seleccionado
                          ? 'btn-primary shadow-sm fw-semibold border-primary'
                          : 'btn-outline-secondary border-opacity-50 text-body bg-body'
                      }`}
                    >
                      {seleccionado && <Check size={13} strokeWidth={3} />}
                      <span>{preset.texto}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input manual con conversión en horas limpia */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="text-muted small">O escribe los minutos exactos:</span>
                <div className="input-group" style={{ width: '160px' }}>
                  <input
                    id="cancelacionMinutos"
                    aria-label="Antelación mínima para cancelar en línea (en minutos)"
                    type="number"
                    min={1}
                    max={10080}
                    className="form-control text-center fw-bold politicas-number-input"
                    value={cancelacionMinutos}
                    onChange={(e) => setCancelacionMinutos(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <span className="input-group-text small">min</span>
                </div>
                {equivCancelacion && (
                  <span className="text-primary fw-semibold small bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill px-2 py-1">
                    {equivCancelacion}
                  </span>
                )}
              </div>
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                💡 Puedes escribir manualmente el tiempo que desees si necesitas un margen mayor (por ejemplo 360 min para 6 horas o 1440 min para 1 día).
              </small>
            </div>
          </div>

          <hr className="my-0 opacity-25" />

          {/* SECCIÓN 3: Tolerancia de Inasistencia (No-Show) */}
          <div className="row g-3 align-items-start">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-2 rounded-2 bg-danger bg-opacity-10 text-danger">
                  <AlertTriangle size={18} />
                </div>
                <label htmlFor="noShowMinutos" className="fw-bold mb-0 text-body">
                  Tolerancia de inasistencia (No-Show)
                </label>
              </div>
              <p className="text-muted small mb-0 ps-md-4 ms-md-2">
                Minutos de espera tras la hora pactada antes de permitir marcar la cita como no asistida.
              </p>
            </div>

            <div className="col-12 col-md-7">
              {/* Opciones rápidas */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                {PRESETS_NO_SHOW.map((preset) => {
                  const seleccionado = noShowMinutos === preset.minutos;
                  return (
                    <button
                      key={preset.minutos}
                      type="button"
                      onClick={() => setNoShowMinutos(preset.minutos)}
                      className={`btn btn-sm px-3 py-1 rounded-pill border d-inline-flex align-items-center gap-1 transition-all ${
                        seleccionado
                          ? 'btn-primary shadow-sm fw-semibold border-primary'
                          : 'btn-outline-secondary border-opacity-50 text-body bg-body'
                      }`}
                    >
                      {seleccionado && <Check size={13} strokeWidth={3} />}
                      <span>{preset.texto}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input manual */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="text-muted small">O escribe los minutos exactos:</span>
                <div className="input-group" style={{ width: '160px' }}>
                  <input
                    id="noShowMinutos"
                    aria-label="Tolerancia de inasistencia (No-Show)"
                    type="number"
                    min={1}
                    max={10080}
                    className="form-control text-center fw-bold politicas-number-input"
                    value={noShowMinutos}
                    onChange={(e) => setNoShowMinutos(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <span className="input-group-text small">min</span>
                </div>
                {equivNoShow && (
                  <span className="text-primary fw-semibold small bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill px-2 py-1">
                    {equivNoShow}
                  </span>
                )}
              </div>
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.78rem' }}>
                💡 Si quieres dar más tolerancia de cortesía a los clientes antes de marcarlos ausentes, puedes colocar un número mayor libremente.
              </small>
            </div>
          </div>
        </div>

        {/* Footer con Botón Guardar y feedback visual inmediato */}
        <div className="card-footer bg-body-tertiary border-top p-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              Los cambios se aplicarán inmediatamente a las nuevas reservas de la barbería.
            </span>

            {/* Aviso visual inmediato junto al botón al guardar con éxito */}
            {exito && (
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={14} /> ¡Políticas guardadas correctamente!
              </span>
            )}

            {/* Aviso visual de error junto al botón */}
            {error && (
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1">
                <AlertTriangle size={14} /> {error}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold shadow-sm"
            disabled={guardando}
          >
            {guardando ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Políticas de Reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

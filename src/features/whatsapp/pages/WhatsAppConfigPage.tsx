import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  LogOut,
  QrCode,
  Smartphone,
  Bell,
  Clock,
  Sparkles,
  CheckCheck,
  Send,
  FileEdit,
} from 'lucide-react';
import { whatsappService } from '../api/whatsapp.service';
import type { WhatsAppStatus } from '../types/whatsapp.types';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import { TabPersonalizacionPlantillas } from '../components/TabPersonalizacionPlantillas';
import './WhatsAppConfigPage.css';

interface VariableInfo {
  tag: string;
  label: string;
  ejemplo: string;
  descripcion: string;
}

export const VARIABLES_DISPONIBLES: VariableInfo[] = [
  {
    tag: '{cliente}',
    label: 'Cliente',
    ejemplo: 'Juan Pérez',
    descripcion: 'Nombre y apellido de quien reservó',
  },
  {
    tag: '{fecha}',
    label: 'Fecha',
    ejemplo: '2026-10-19',
    descripcion: 'Fecha de la cita',
  },
  {
    tag: '{hora}',
    label: 'Hora',
    ejemplo: '14:00',
    descripcion: 'Hora programada de la cita',
  },
  {
    tag: '{servicio}',
    label: 'Servicio',
    ejemplo: 'Corte Clásico',
    descripcion: 'Servicio seleccionado',
  },
  {
    tag: '{barbero}',
    label: 'Barbero',
    ejemplo: 'Carlos Gómez',
    descripcion: 'Barbero asignado para la cita',
  },
  {
    tag: '{precio}',
    label: 'Precio',
    ejemplo: '$25.000',
    descripcion: 'Valor del servicio reservado',
  },
  {
    tag: '{ubicacion}',
    label: 'Ubicación',
    ejemplo: 'Carrera 6 # 3-45',
    descripcion: 'Dirección física de la barbería',
  },
];

export const PRESETS = {
  confirmacion: [
    {
      id: 'moderno',
      nombre: 'Moderno (Recomendado)',
      icono: '💈',
      texto:
        `💈 *KYRIOS BARBER STUDIO*\n` +
        `¡Hola {cliente}! Tu cita ha sido agendada con éxito.\n\n` +
        `📅 *Fecha:* {fecha}\n` +
        `⏰ *Hora:* {hora}\n` +
        `✂️ *Servicio:* {servicio}\n` +
        `💈 *Barbero:* {barbero}{precio}\n\n` +
        `📍 *Ubicación:* {ubicacion}\n` +
        `_Te esperamos 5 minutos antes de tu cita. ¡Gracias por elegirnos!_`,
    },
    {
      id: 'formal',
      nombre: 'Formal & Elegante',
      icono: '👔',
      texto:
        `Estimado(a) *{cliente}*,\n` +
        `Le confirmamos que su cita en *Kyrios Barber Studio* ha sido agendada con éxito.\n\n` +
        `📅 *Fecha:* {fecha}\n` +
        `⏰ *Hora:* {hora}\n` +
        `✂️ *Servicio:* {servicio}\n` +
        `💈 *Especialista:* {barbero}{precio}\n\n` +
        `📍 *Dirección:* {ubicacion}\n` +
        `_Por favor presentarse con 5 minutos de anticipación. Agradecemos su preferencia._`,
    },
    {
      id: 'breve',
      nombre: 'Corto & Directo',
      icono: '⚡',
      texto:
        `💈 *Kyrios Barber* | Cita confirmada para *{cliente}*\n\n` +
        `✂️ {servicio} con {barbero}\n` +
        `📅 {fecha} a las {hora}{precio}\n` +
        `📍 {ubicacion}\n\n` +
        `_¡Te esperamos!_`,
    },
  ],
  recordatorio: [
    {
      id: 'moderno',
      nombre: 'Moderno (Recomendado)',
      icono: '⏰',
      texto:
        `⏰ *RECORDATORIO DE TU CITA - KYRIOS BARBER*\n` +
        `¡Hola {cliente}! Te recordamos que tienes una cita programada para hoy:\n\n` +
        `⏰ *Hora:* {hora}\n` +
        `✂️ *Servicio:* {servicio}\n` +
        `💈 *Barbero:* {barbero}\n\n` +
        `📍 *Ubicación:* {ubicacion}\n` +
        `_Si no puedes asistir o necesitas reprogramar, por favor avísanos con tiempo._`,
    },
    {
      id: 'formal',
      nombre: 'Formal & Elegante',
      icono: '👔',
      texto:
        `⏰ *Recordatorio de Cita - Kyrios Barber Studio*\n` +
        `Estimado(a) *{cliente}*, le recordamos su cita programada para el día de hoy:\n\n` +
        `⏰ *Hora:* {hora}\n` +
        `✂️ *Servicio:* {servicio}\n` +
        `💈 *Especialista:* {barbero}\n\n` +
        `📍 *Dirección:* {ubicacion}\n` +
        `_Agradecemos su puntualidad. Si requiere reprogramar, comuníquese con nosotros._`,
    },
    {
      id: 'breve',
      nombre: 'Corto & Directo',
      icono: '⚡',
      texto:
        `⏰ *Recordatorio*: ¡Hola {cliente}! Tu cita en *Kyrios Barber* es hoy a las *{hora}* con {barbero} ({servicio}). 📍 {ubicacion}. ¡Te esperamos!`,
    },
  ],
};

export const EMOJIS_RAPIDOS = ['💈', '✂️', '⏰', '📅', '📍', '💰', '⭐', '👋', '✅', '🔥'];

export const PRESETS_ANTICIPACION = [
  { minutos: 30, label: '30 min antes', icono: '⚡' },
  { minutos: 60, label: '1 hora antes', icono: '⏱️' },
  { minutos: 120, label: '2 horas antes (Recomendado)', icono: '⭐' },
  { minutos: 180, label: '3 horas antes', icono: '🕒' },
  { minutos: 240, label: '4 horas antes', icono: '🕓' },
];

export const formatoHorasMinutos = (mins: number) => {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m > 0) return `${h}h ${m}m`;
    const sufijo = h > 1 ? 'horas' : 'hora';
    return `${h} ${sufijo}`;
  }
  return `${mins} minutos`;
};

export const getEjemploEnvio = (mins: number) => {
  const citaHora = 16 * 60; // 4:00 PM (16:00)
  const envioHora = Math.max(0, citaHora - mins);
  const h = Math.floor(envioHora / 60);
  const m = envioHora % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  let displayH = h;
  if (h > 12) {
    displayH = h - 12;
  } else if (h === 0) {
    displayH = 12;
  }
  const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  return `Ejemplo: Si un cliente tiene cita a las 4:00 PM, recibirá el recordatorio a las ${timeStr} (${formatoHorasMinutos(mins)} antes).`;
};

export const renderPreviewTexto = (texto: string) => {
  if (!texto) return '';
  return texto
    .replaceAll('{cliente}', 'Juan Pérez')
    .replaceAll('{servicio}', 'Corte Clásico')
    .replaceAll('{barbero}', 'Carlos Gómez')
    .replaceAll('{fecha}', '2026-10-19')
    .replaceAll('{hora}', '14:00')
    .replaceAll('{precio}', () => '\n💰 *Valor:* $25.000')
    .replaceAll('{ubicacion}', 'Carrera 6 # 3-45, Centro Histórico, Popayán');
};

export const formatWhatsAppMarkdown = (content: string): React.ReactNode => {
  const formatted = renderPreviewTexto(content);
  return formatted.split('\n').map((line, idx) => {
    let parsed = line;
    parsed = parsed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/_(.*?)_/g, '<em>$1</em>');
    return (
      <span key={`wa-preview-line-${idx}-${line.slice(0, 15)}`}>
        <span dangerouslySetInnerHTML={{ __html: parsed }} />
        <br />
      </span>
    );
  });
};

interface WhatsAppConectadoViewProps {
  minutosAnticipacion: number;
  plantillaConfirmacion: string;
  isDisconnecting: boolean;
  onDesconectar: () => void;
  formatWhatsAppMarkdown: (content: string) => React.ReactNode;
}

const WhatsAppConectadoView: React.FC<WhatsAppConectadoViewProps> = ({
  minutosAnticipacion,
  plantillaConfirmacion,
  isDisconnecting,
  onDesconectar,
  formatWhatsAppMarkdown,
}) => (
  <div className="wa-grid">
    <div className="wa-card">
      <div className="wa-connected-banner">
        <div className="wa-connected-icon-box">
          <CheckCircle2 size={32} />
        </div>
        <div className="wa-connected-info">
          <h4>WhatsApp Vinculado con Éxito</h4>
          <p>
            El sistema está despachando notificaciones automáticas usando el número oficial de la barbería.
          </p>
        </div>
      </div>

      <div className="wa-card-header">
        <h3 className="wa-card-title">
          <Sparkles size={18} className="text-warning" />
          Automatizaciones Activas
        </h3>
      </div>

      <div className="wa-features-grid">
        <div className="wa-feature-card">
          <Send size={20} className="wa-feature-icon" />
          <div>
            <div className="wa-feature-title">Confirmación Inmediata</div>
            <p className="wa-feature-desc">
              Se envía en milisegundos cuando un cliente reserva una cita desde la web.
            </p>
          </div>
        </div>

        <div className="wa-feature-card">
          <Clock size={20} className="wa-feature-icon" />
          <div>
            <div className="wa-feature-title">
              Recordatorio {formatoHorasMinutos(minutosAnticipacion)} Antes
            </div>
            <p className="wa-feature-desc">
              El cron job evalúa citas activas cada 10 minutos y envía un recordatorio oportuno.
            </p>
          </div>
        </div>

        <div className="wa-feature-card">
          <Bell size={20} className="wa-feature-icon" />
          <div>
            <div className="wa-feature-title">Mensajes Dinámicos</div>
            <p className="wa-feature-desc">
              Puedes personalizar los textos y variables desde la pestaña "Personalización de Mensajes".
            </p>
          </div>
        </div>

        <div className="wa-feature-card">
          <Smartphone size={20} className="wa-feature-icon" />
          <div>
            <div className="wa-feature-title">Cero Costos de API</div>
            <p className="wa-feature-desc">
              Conexión nativa WebSockets directa con WhatsApp sin cobros por mensaje.
            </p>
          </div>
        </div>
      </div>

      <div className="wa-disconnect-section">
        <button
          type="button"
          className="wa-btn-disconnect"
          onClick={onDesconectar}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <>
              <KyriosSpinner />
              <span>Cerrando sesión...</span>
            </>
          ) : (
            <>
              <LogOut size={16} />
              <span>Desvincular WhatsApp de la Barbería</span>
            </>
          )}
        </button>
      </div>
    </div>

    {/* Panel Derecho: Vista previa rápida */}
    <div className="wa-card">
      <div className="wa-card-header">
        <h3 className="wa-card-title">
          <MessageSquare size={18} className="text-success" />
          Vista Previa del Mensaje Activo
        </h3>
      </div>

      <div className="wa-chat-preview-box">
        <div className="wa-bubble">
          {formatWhatsAppMarkdown(plantillaConfirmacion)}
          <div className="wa-bubble-time">
            <span>14:00</span>
            <CheckCheck size={14} className="wa-bubble-ticks" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface WhatsAppDesconectadoViewProps {
  isQrExpired: boolean;
  qrCode?: string | null;
  qrSecondsLeft: number;
  onRecargarQR: () => void;
}

const WhatsAppDesconectadoView: React.FC<WhatsAppDesconectadoViewProps> = ({
  isQrExpired,
  qrCode,
  qrSecondsLeft,
  onRecargarQR,
}) => {
  const renderContenidoQr = () => {
    if (isQrExpired) {
      return (
        <>
          <div className="wa-qr-frame">
            <div className="wa-qr-expired-overlay">
              <div className="wa-qr-expired-content">
                <div className="wa-qr-expired-icon-box">
                  <Clock size={32} className="text-warning" />
                </div>
                <div className="wa-qr-expired-title">Código QR Expirado</div>
                <p className="wa-qr-expired-desc">
                  El código caducó por inactividad para no saturar recursos.
                </p>
                <button
                  type="button"
                  className="wa-btn-reload-qr"
                  onClick={onRecargarQR}
                >
                  <RefreshCw size={15} />
                  <span>Recargar Código QR</span>
                </button>
              </div>
            </div>
            {qrCode && (
              <img
                src={qrCode}
                alt="Código QR de WhatsApp"
                className="wa-qr-image blur"
              />
            )}
          </div>

          <p className="text-warning small mt-1 mb-0 d-flex align-items-center justify-content-center gap-1">
            <AlertCircle size={14} />
            <span>Haz clic en "Recargar Código QR" para generar un código fresco.</span>
          </p>
        </>
      );
    }

    if (qrCode) {
      return (
        <>
          <div className="wa-qr-frame">
            <img
              src={qrCode}
              alt="Código QR de WhatsApp"
              className="wa-qr-image"
            />
          </div>

          <div className="wa-qr-countdown-text">
            <span className="wa-radar-dot connected" style={{ width: 6, height: 6 }} />
            <span>
              Expira en {Math.floor(qrSecondsLeft / 60)}:
              {(qrSecondsLeft % 60).toString().padStart(2, '0')} min (Sondeo activo)
            </span>
          </div>
        </>
      );
    }

    return (
      <div className="wa-qr-loading">
        <KyriosSpinner />
        <p className="wa-qr-loading-text">
          Generando código QR criptográfico seguro...
          <br />
          <span className="small text-muted">
            Espere un instante mientras el motor de WhatsApp responde.
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="wa-grid">
      <div className="wa-card text-center">
        <div className="wa-card-header justify-content-center">
          <h3 className="wa-card-title">
            <QrCode size={20} className="text-success" />
            Escanea el Código QR
          </h3>
        </div>

        <div className="wa-qr-container">
          {renderContenidoQr()}
        </div>
      </div>

      <div className="wa-card">
      <div className="wa-card-header">
        <h3 className="wa-card-title">
          <Smartphone size={20} className="text-success" />
          Instrucciones de Vinculación
        </h3>
      </div>

      <div className="wa-steps-list">
        <div className="wa-step-item">
          <div className="wa-step-number">1</div>
          <div className="wa-step-content">
            <div className="wa-step-title">Abre WhatsApp en tu teléfono</div>
            <p className="wa-step-desc">
              Inicia la aplicación de WhatsApp oficial en el dispositivo móvil de la barbería.
            </p>
          </div>
        </div>

        <div className="wa-step-item">
          <div className="wa-step-number">2</div>
          <div className="wa-step-content">
            <div className="wa-step-title">Ingresa a Dispositivos vinculados</div>
            <p className="wa-step-desc">
              Toca en <strong>Menú (⋮)</strong> en Android o{' '}
              <strong>Ajustes / Configuración (⚙️)</strong> en iPhone y elige <strong>Dispositivos vinculados</strong>.
            </p>
          </div>
        </div>

        <div className="wa-step-item">
          <div className="wa-step-number">3</div>
          <div className="wa-step-content">
            <div className="wa-step-title">Toca en "Vincular un dispositivo"</div>
            <p className="wa-step-desc">
              Desbloquea tu teléfono mediante huella, rostro o PIN cuando sea solicitado.
            </p>
          </div>
        </div>

        <div className="wa-step-item">
          <div className="wa-step-number">4</div>
          <div className="wa-step-content">
            <div className="wa-step-title">Apunta tu cámara al código QR</div>
            <p className="wa-step-desc">
              Escanea el código que aparece en esta pantalla. La conexión se detectará automáticamente en segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

interface TabConexionViewProps {
  loading: boolean;
  status: WhatsAppStatus | null;
  isConnected: boolean;
  minutosAnticipacion: number;
  plantillaConfirmacion: string;
  isDisconnecting: boolean;
  onDesconectar: () => void;
  formatWhatsAppMarkdown: (content: string) => React.ReactNode;
  isQrExpired: boolean;
  qrCode?: string | null;
  qrSecondsLeft: number;
  onRecargarQR: () => void;
}

const TabConexionView: React.FC<TabConexionViewProps> = ({
  loading,
  status,
  isConnected,
  minutosAnticipacion,
  plantillaConfirmacion,
  isDisconnecting,
  onDesconectar,
  formatWhatsAppMarkdown,
  isQrExpired,
  qrCode,
  qrSecondsLeft,
  onRecargarQR,
}) => {
  if (loading && !status) {
    return (
      <div className="wa-card text-center py-5">
        <KyriosSpinner />
        <p className="mt-3 text-secondary">
          Conectando con el motor de WhatsApp...
        </p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <WhatsAppConectadoView
        minutosAnticipacion={minutosAnticipacion}
        plantillaConfirmacion={plantillaConfirmacion}
        isDisconnecting={isDisconnecting}
        onDesconectar={onDesconectar}
        formatWhatsAppMarkdown={formatWhatsAppMarkdown}
      />
    );
  }

  return (
    <WhatsAppDesconectadoView
      isQrExpired={isQrExpired}
      qrCode={qrCode}
      qrSecondsLeft={qrSecondsLeft}
      onRecargarQR={onRecargarQR}
    />
  );
};

export const WhatsAppConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conexion' | 'plantillas'>('conexion');
  const [subTab, setSubTab] = useState<'confirmacion' | 'recordatorio'>('confirmacion');

  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Control de inactividad del código QR (1 minuto / 60 segundos de expiración)
  const QR_TIMEOUT_SECONDS = 60;
  const [isQrExpired, setIsQrExpired] = useState<boolean>(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(QR_TIMEOUT_SECONDS);

  // Estado de plantillas y tiempo de anticipación del recordatorio
  const [plantillaConfirmacion, setPlantillaConfirmacion] = useState<string>('');
  const [plantillaRecordatorio, setPlantillaRecordatorio] = useState<string>('');
  const [minutosAnticipacion, setMinutosAnticipacion] = useState<number>(120);
  const [modoPersonalizado, setModoPersonalizado] = useState<boolean>(false);
  const [isSavingTemplates, setIsSavingTemplates] = useState<boolean>(false);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { showToast } = useToastContext();
  const confirm = useConfirm();

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const data = await whatsappService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      console.error('Error al consultar estado de WhatsApp:', err);
      setError(
        'No se pudo conectar con el servicio de WhatsApp. Verifica que el backend esté en ejecución.',
      );
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  const fetchPlantillas = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const data = await whatsappService.getPlantillas();
      setPlantillaConfirmacion(data.confirmacion);
      setPlantillaRecordatorio(data.recordatorio);
      if (data.minutosAnticipacion) {
        setMinutosAnticipacion(data.minutosAnticipacion);
        const esPreset = PRESETS_ANTICIPACION.some(
          (p) => p.minutos === data.minutosAnticipacion,
        );
        setModoPersonalizado(!esPreset);
      }
    } catch (err) {
      console.error('Error al cargar plantillas de WhatsApp:', err);
      showToast('danger', 'No se pudieron cargar las plantillas de mensajes.');
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast]);

  // Ref para rastrear estado de conexión actual en el ciclo de vida (desmontaje)
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Si el usuario sale de la pantalla y WhatsApp no quedó conectado,
  // pausamos el socket en el backend de inmediato para ahorrar recursos.
  useEffect(() => {
    return () => {
      if (!statusRef.current?.conectado) {
        void whatsappService.pausar().catch(() => {});
      }
    };
  }, []);

  // Cuando el QR expira por inactividad, notificamos al backend para entrar en modo reposo
  useEffect(() => {
    if (isQrExpired) {
      void whatsappService.pausar().catch(() => {});
    }
  }, [isQrExpired]);

  // Temporizador de inactividad de 60 segundos y sondeo condicional para no saturar recursos
  useEffect(() => {
    void fetchPlantillas();

    if (status?.conectado) {
      setIsQrExpired(false);
      // Cuando ya está conectado, sondeo suave cada 10 segundos
      const timer = setInterval(() => {
        void fetchStatus();
      }, 10000);
      return () => clearInterval(timer);
    }

    // Si NO está conectado y el QR NO ha expirado:
    if (!isQrExpired) {
      // Despertar socket bajo demanda al entrar
      void whatsappService.iniciar().then(() => fetchStatus()).catch(() => fetchStatus());

      // Sondeo rápido cada 3 segundos
      const pollTimer = setInterval(() => {
        void fetchStatus();
      }, 3000);

      // Cuenta regresiva de 60 segundos
      const countdownTimer = setInterval(() => {
        setQrSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsQrExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(pollTimer);
        clearInterval(countdownTimer);
      };
    }
  }, [fetchStatus, fetchPlantillas, status?.conectado, isQrExpired]);

  const handleRecargarQR = async () => {
    setIsQrExpired(false);
    setQrSecondsLeft(QR_TIMEOUT_SECONDS);
    showToast('info', 'Generando nuevo código QR de WhatsApp...');
    try {
      await whatsappService.iniciar();
      await fetchStatus(true);
    } catch (err) {
      console.error('Error al reactivar WhatsApp:', err);
    }
  };

  const handleDesconectar = async () => {
    const confirmado = await confirm({
      title: '¿Desvincular WhatsApp?',
      message:
        'Al desvincular el dispositivo, la barbería dejará de enviar confirmaciones y recordatorios automáticos a los clientes por WhatsApp hasta que se vuelva a escanear un nuevo código QR.',
      confirmLabel: 'Sí, desvincular',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmado) return;

    try {
      setIsDisconnecting(true);
      const res = await whatsappService.desconectar();
      showToast('success', res.mensaje || 'WhatsApp desvinculado con éxito.');
      await fetchStatus(true);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        'Error al intentar desvincular WhatsApp.';
      showToast('danger', errorMsg);
    } finally {
      setIsDisconnecting(false);
    }
  };

  /**
   * Inserta texto exactamente en la posición actual del cursor dentro del textarea.
   */
  const handleInsertText = (text: string) => {
    const textarea = textareaRef.current;
    const currentVal =
      subTab === 'confirmacion' ? plantillaConfirmacion : plantillaRecordatorio;

    if (textarea) {
      const start = textarea.selectionStart ?? currentVal.length;
      const end = textarea.selectionEnd ?? currentVal.length;
      const newVal =
        currentVal.substring(0, start) + text + currentVal.substring(end);

      if (subTab === 'confirmacion') {
        setPlantillaConfirmacion(newVal);
      } else {
        setPlantillaRecordatorio(newVal);
      }

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    } else if (subTab === 'confirmacion') {
      setPlantillaConfirmacion((prev) => prev + ` ${text}`);
    } else {
      setPlantillaRecordatorio((prev) => prev + ` ${text}`);
    }
  };

  /**
   * Envuelve el texto seleccionado con prefijo y sufijo (ej: *negrita* o _cursiva_).
   */
  const handleWrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal =
      subTab === 'confirmacion' ? plantillaConfirmacion : plantillaRecordatorio;

    const selectedText = currentVal.substring(start, end);
    const textToInsert = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}texto${suffix}`;

    const newVal =
      currentVal.substring(0, start) + textToInsert + currentVal.substring(end);

    if (subTab === 'confirmacion') {
      setPlantillaConfirmacion(newVal);
    } else {
      setPlantillaRecordatorio(newVal);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 5),
      );
    }, 0);
  };

  /**
   * Carga una plantilla de ejemplo prediseñada en el editor.
   */
  const handleApplyPreset = (texto: string, nombrePreset: string) => {
    if (subTab === 'confirmacion') {
      setPlantillaConfirmacion(texto);
    } else {
      setPlantillaRecordatorio(texto);
    }
    showToast('info', `Estilo "${nombrePreset}" cargado en el editor.`);
    textareaRef.current?.focus();
  };

  const handleGuardarPlantillas = async () => {
    try {
      setIsSavingTemplates(true);
      const actualizadas = await whatsappService.guardarPlantillas({
        confirmacion: plantillaConfirmacion,
        recordatorio: plantillaRecordatorio,
        minutosAnticipacion,
      });
      setPlantillaConfirmacion(actualizadas.confirmacion);
      setPlantillaRecordatorio(actualizadas.recordatorio);
      if (actualizadas.minutosAnticipacion) {
        setMinutosAnticipacion(actualizadas.minutosAnticipacion);
      }
      showToast('success', 'Plantillas y configuración de recordatorio guardadas con éxito.');
    } catch (err: unknown) {
      console.error('Error al guardar las plantillas de WhatsApp:', err);
      showToast('danger', 'Error al guardar las plantillas de WhatsApp.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const handleResetPlantillas = async () => {
    const confirmado = await confirm({
      title: '¿Restablecer plantillas oficiales?',
      message:
        'Esto borrará las personalizaciones actuales y restaurará los mensajes y el tiempo de anticipación (2 horas) por defecto de Kyrios Barber Studio.',
      confirmLabel: 'Restablecer por Defecto',
      cancelLabel: 'Cancelar',
      variant: 'warning',
    });

    if (!confirmado) return;

    try {
      setIsSavingTemplates(true);
      const defaults = await whatsappService.resetPlantillas();
      setPlantillaConfirmacion(defaults.confirmacion);
      setPlantillaRecordatorio(defaults.recordatorio);
      setMinutosAnticipacion(defaults.minutosAnticipacion ?? 120);
      setModoPersonalizado(false);
      showToast('info', 'Plantillas y configuración restablecidas por defecto.');
    } catch (err: unknown) {
      console.error('Error al restablecer las plantillas:', err);
      showToast('danger', 'Error al restablecer las plantillas.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const isConnected = status?.conectado ?? false;
  const qrCode = status?.qr;

  return (
    <div className="wa-page-container">
      {/* Cabecera Editorial */}
      <div className="wa-header d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h1 className="wa-header-title">
            <MessageSquare className="wa-header-icon" size={30} />
            Integración Oficial de WhatsApp
          </h1>
          <p className="wa-header-subtitle">
            Notificaciones automáticas de citas y recordatorios en tiempo real vía
            WhatsApp Web.
          </p>
        </div>

        <div className="d-flex align-items-center gap-3">
          <span
            className={`wa-status-badge ${
              isConnected ? 'connected' : 'disconnected'
            }`}
          >
            <span
              className={`wa-radar-dot ${
                isConnected ? 'connected' : 'disconnected'
              }`}
            />
            {isConnected ? 'Conectado y Operativo' : 'Desconectado'}
          </span>

          <button
            type="button"
            className="wa-refresh-btn"
            onClick={handleRecargarQR}
            disabled={isRefreshing || loading}
            title="Actualizar estado manualmente"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'spinner-border spinner-border-sm' : ''}
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pestañas de navegación */}
      <div className="wa-nav-tabs">
        <button
          type="button"
          className={`wa-nav-tab ${activeTab === 'conexion' ? 'active' : ''}`}
          onClick={() => setActiveTab('conexion')}
        >
          <Smartphone size={18} />
          <span>Conexión y Estado</span>
        </button>

        <button
          type="button"
          className={`wa-nav-tab ${activeTab === 'plantillas' ? 'active' : ''}`}
          onClick={() => setActiveTab('plantillas')}
        >
          <FileEdit size={18} />
          <span>Personalización de Mensajes</span>
        </button>
      </div>

      {/* ================= PESTAÑA 1: CONEXIÓN Y ESTADO ================= */}
      {activeTab === 'conexion' && (
        <TabConexionView
          loading={loading}
          status={status}
          isConnected={isConnected}
          minutosAnticipacion={minutosAnticipacion}
          plantillaConfirmacion={plantillaConfirmacion}
          isDisconnecting={isDisconnecting}
          onDesconectar={handleDesconectar}
          formatWhatsAppMarkdown={formatWhatsAppMarkdown}
          isQrExpired={isQrExpired}
          qrCode={qrCode}
          qrSecondsLeft={qrSecondsLeft}
          onRecargarQR={handleRecargarQR}
        />
      )}

      {/* ================= PESTAÑA 2: PERSONALIZACIÓN DE PLANTILLAS ================= */}
      {activeTab === 'plantillas' && (
        <TabPersonalizacionPlantillas
          subTab={subTab}
          setSubTab={setSubTab}
          minutosAnticipacion={minutosAnticipacion}
          setMinutosAnticipacion={setMinutosAnticipacion}
          modoPersonalizado={modoPersonalizado}
          setModoPersonalizado={setModoPersonalizado}
          plantillaConfirmacion={plantillaConfirmacion}
          setPlantillaConfirmacion={setPlantillaConfirmacion}
          plantillaRecordatorio={plantillaRecordatorio}
          setPlantillaRecordatorio={setPlantillaRecordatorio}
          loadingTemplates={loadingTemplates}
          isSavingTemplates={isSavingTemplates}
          textareaRef={textareaRef}
          onInsertText={handleInsertText}
          onWrapSelection={handleWrapSelection}
          onApplyPreset={handleApplyPreset}
          onResetPlantillas={handleResetPlantillas}
          onGuardarPlantillas={handleGuardarPlantillas}
          formatWhatsAppMarkdown={formatWhatsAppMarkdown}
        />
      )}
    </div>
  );
};

export default WhatsAppConfigPage;

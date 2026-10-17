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
  RotateCcw,
  Save,
  Tag,
  Bold,
  Italic,
  Lightbulb,
  Info,
} from 'lucide-react';
import { whatsappService } from '../api/whatsapp.service';
import type { WhatsAppStatus } from '../types/whatsapp.types';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import './WhatsAppConfigPage.css';

interface VariableInfo {
  tag: string;
  label: string;
  ejemplo: string;
  descripcion: string;
}

const VARIABLES_DISPONIBLES: VariableInfo[] = [
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

const PRESETS = {
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

const EMOJIS_RAPIDOS = ['💈', '✂️', '⏰', '📅', '📍', '💰', '⭐', '👋', '✅', '🔥'];

export const WhatsAppConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conexion' | 'plantillas'>('conexion');
  const [subTab, setSubTab] = useState<'confirmacion' | 'recordatorio'>('confirmacion');

  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de plantillas
  const [plantillaConfirmacion, setPlantillaConfirmacion] = useState<string>('');
  const [plantillaRecordatorio, setPlantillaRecordatorio] = useState<string>('');
  const [isSavingTemplates, setIsSavingTemplates] = useState<boolean>(false);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { showToast } = useToastContext();
  const confirm = useConfirm();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    } catch (err) {
      console.error('Error al cargar plantillas de WhatsApp:', err);
      showToast('danger', 'No se pudieron cargar las plantillas de mensajes.');
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast]);

  // Polling automático cada 3 segundos para el estado de la conexión
  useEffect(() => {
    void fetchStatus();
    void fetchPlantillas();

    pollTimerRef.current = setInterval(() => {
      void fetchStatus();
    }, 3000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchStatus, fetchPlantillas]);

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
    } else {
      if (subTab === 'confirmacion') {
        setPlantillaConfirmacion((prev) => prev + ` ${text}`);
      } else {
        setPlantillaRecordatorio((prev) => prev + ` ${text}`);
      }
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
      });
      setPlantillaConfirmacion(actualizadas.confirmacion);
      setPlantillaRecordatorio(actualizadas.recordatorio);
      showToast('success', 'Plantillas de mensajes actualizadas con éxito.');
    } catch (err: any) {
      showToast('danger', 'Error al guardar las plantillas de WhatsApp.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const handleResetPlantillas = async () => {
    const confirmado = await confirm({
      title: '¿Restablecer plantillas oficiales?',
      message:
        'Esto borrará las personalizaciones actuales y restaurará los mensajes por defecto de Kyrios Barber Studio.',
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
      showToast('info', 'Plantillas restablecidas a los textos por defecto.');
    } catch (err: any) {
      showToast('danger', 'Error al restablecer las plantillas.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  // Generador de vista previa realista
  const renderPreviewTexto = (texto: string) => {
    if (!texto) return '';
    return texto
      .replace(/{cliente}/g, 'Juan Pérez')
      .replace(/{servicio}/g, 'Corte Clásico')
      .replace(/{barbero}/g, 'Carlos Gómez')
      .replace(/{fecha}/g, '2026-10-19')
      .replace(/{hora}/g, '14:00')
      .replace(/{precio}/g, '\n💰 *Valor:* $25.000')
      .replace(/{ubicacion}/g, 'Carrera 6 # 3-45, Centro Histórico, Popayán');
  };

  const formatWhatsAppMarkdown = (content: string) => {
    const formatted = renderPreviewTexto(content);
    // Transforma *negrita* en <strong> y _cursiva_ en <em>
    return formatted.split('\n').map((line, idx) => {
      let parsed = line;
      // *bold*
      parsed = parsed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      // _italic_
      parsed = parsed.replace(/_(.*?)_/g, '<em>$1</em>');

      return (
        <span key={idx}>
          <span dangerouslySetInnerHTML={{ __html: parsed }} />
          <br />
        </span>
      );
    });
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
            onClick={() => void fetchStatus(true)}
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
        <>
          {loading && !status ? (
            <div className="wa-card text-center py-5">
              <KyriosSpinner />
              <p className="mt-3 text-secondary">
                Conectando con el motor de WhatsApp...
              </p>
            </div>
          ) : isConnected ? (
            /* VISTA: CONECTADO */
            <div className="wa-grid">
              <div className="wa-card">
                <div className="wa-connected-banner">
                  <div className="wa-connected-icon-box">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="wa-connected-info">
                    <h4>WhatsApp Vinculado con Éxito</h4>
                    <p>
                      El sistema está despachando notificaciones automáticas usando
                      el número oficial de la barbería.
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
                      <div className="wa-feature-title">
                        Confirmación Inmediata
                      </div>
                      <p className="wa-feature-desc">
                        Se envía en milisegundos cuando un cliente reserva una cita
                        desde la web.
                      </p>
                    </div>
                  </div>

                  <div className="wa-feature-card">
                    <Clock size={20} className="wa-feature-icon" />
                    <div>
                      <div className="wa-feature-title">
                        Recordatorio 2 Horas Antes
                      </div>
                      <p className="wa-feature-desc">
                        El cron job evalúa citas activas cada 10 minutos y envía un
                        recordatorio oportuno.
                      </p>
                    </div>
                  </div>

                  <div className="wa-feature-card">
                    <Bell size={20} className="wa-feature-icon" />
                    <div>
                      <div className="wa-feature-title">
                        Mensajes Dinámicos
                      </div>
                      <p className="wa-feature-desc">
                        Puedes personalizar los textos y variables desde la pestaña
                        "Personalización de Mensajes".
                      </p>
                    </div>
                  </div>

                  <div className="wa-feature-card">
                    <Smartphone size={20} className="wa-feature-icon" />
                    <div>
                      <div className="wa-feature-title">Cero Costos de API</div>
                      <p className="wa-feature-desc">
                        Conexión nativa WebSockets directa con WhatsApp sin cobros
                        por mensaje.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="wa-disconnect-section">
                  <button
                    type="button"
                    className="wa-btn-disconnect"
                    onClick={handleDesconectar}
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
          ) : (
            /* VISTA: DESCONECTADO (MOSTRAR QR) */
            <div className="wa-grid">
              <div className="wa-card text-center">
                <div className="wa-card-header justify-content-center">
                  <h3 className="wa-card-title">
                    <QrCode size={20} className="text-success" />
                    Escanea el Código QR
                  </h3>
                </div>

                <div className="wa-qr-container">
                  {qrCode ? (
                    <>
                      <div className="wa-qr-frame">
                        <img
                          src={qrCode}
                          alt="Código QR de WhatsApp"
                          className="wa-qr-image"
                        />
                      </div>
                      <p className="text-secondary small mt-1 mb-0">
                        El código se renueva automáticamente para garantizar una
                        conexión segura.
                      </p>
                    </>
                  ) : (
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
                  )}
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
                      <div className="wa-step-title">
                        Abre WhatsApp en tu teléfono
                      </div>
                      <p className="wa-step-desc">
                        Inicia la aplicación de WhatsApp oficial en el dispositivo
                        móvil de la barbería.
                      </p>
                    </div>
                  </div>

                  <div className="wa-step-item">
                    <div className="wa-step-number">2</div>
                    <div className="wa-step-content">
                      <div className="wa-step-title">
                        Ingresa a Dispositivos vinculados
                      </div>
                      <p className="wa-step-desc">
                        Toca en <strong>Menú (⋮)</strong> en Android o{' '}
                        <strong>Ajustes / Configuración (⚙️)</strong> en iPhone y
                        elige <strong>Dispositivos vinculados</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="wa-step-item">
                    <div className="wa-step-number">3</div>
                    <div className="wa-step-content">
                      <div className="wa-step-title">
                        Toca en "Vincular un dispositivo"
                      </div>
                      <p className="wa-step-desc">
                        Desbloquea tu teléfono mediante huella, rostro o PIN cuando
                        sea solicitado.
                      </p>
                    </div>
                  </div>

                  <div className="wa-step-item">
                    <div className="wa-step-number">4</div>
                    <div className="wa-step-content">
                      <div className="wa-step-title">
                        Apunta tu cámara al código QR
                      </div>
                      <p className="wa-step-desc">
                        Escanea el código que aparece en esta pantalla. La conexión
                        se detectará automáticamente en segundos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= PESTAÑA 2: PERSONALIZACIÓN DE PLANTILLAS ================= */}
      {activeTab === 'plantillas' && (
        <div className="wa-grid">
          {/* Panel Izquierdo: Editor de Texto y Herramientas */}
          <div className="wa-card">
            <div className="wa-card-header">
              <h3 className="wa-card-title">
                <FileEdit size={18} className="text-success" />
                Editor de Plantillas de Mensajes
              </h3>
            </div>

            {/* Subpestañas entre Confirmación y Recordatorio */}
            <div className="wa-subtabs">
              <button
                type="button"
                className={`wa-subtab-btn ${
                  subTab === 'confirmacion' ? 'active' : ''
                }`}
                onClick={() => setSubTab('confirmacion')}
              >
                <Send size={15} />
                <span>Mensaje de Confirmación</span>
              </button>

              <button
                type="button"
                className={`wa-subtab-btn ${
                  subTab === 'recordatorio' ? 'active' : ''
                }`}
                onClick={() => setSubTab('recordatorio')}
              >
                <Clock size={15} />
                <span>Mensaje de Recordatorio (2h)</span>
              </button>
            </div>

            {/* Banner explicativo del momento de envío */}
            <div className="wa-context-banner">
              <div className="wa-context-badge">
                {subTab === 'confirmacion' ? (
                  <>
                    <Sparkles size={14} className="text-warning" />
                    <span>Disparo Inmediato al Reservar</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} className="text-info" />
                    <span>Disparo Automático (2 Horas Antes)</span>
                  </>
                )}
              </div>
              <p className="wa-context-desc">
                {subTab === 'confirmacion'
                  ? 'Este mensaje se envía de forma automática a WhatsApp tan pronto el cliente confirma su cita en la página web.'
                  : 'El sistema revisa las citas del día cada 10 minutos y envía este recordatorio a los clientes que tengan cita en las próximas 2 horas.'}
              </p>
            </div>

            {/* Estilos Prediseñados (Presets con 1 Clic) */}
            <div className="wa-presets-bar">
              <div className="wa-presets-label">
                <Sparkles size={13} className="text-warning" />
                <span>Plantillas de Ejemplo (Haz clic para usar como base):</span>
              </div>
              <div className="wa-presets-btns">
                {PRESETS[subTab].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="wa-preset-pill"
                    onClick={() => handleApplyPreset(preset.texto, preset.nombre)}
                    title={`Cargar estilo "${preset.nombre}"`}
                  >
                    <span>{preset.icono}</span>
                    <span>{preset.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caja de variables dinámicas insertables */}
            <div className="wa-variables-container">
              <div className="wa-variables-title">
                <Tag size={13} />
                <span>Datos Automáticos de la Cita (Haz clic para insertar):</span>
              </div>
              <p className="wa-variables-desc">
                Al enviarse a un cliente real, cada etiqueta se reemplazará por los datos de su reserva:
              </p>
              <div className="wa-tags-wrap">
                {VARIABLES_DISPONIBLES.map(({ tag, label, ejemplo, descripcion }) => (
                  <button
                    key={tag}
                    type="button"
                    className="wa-tag-pill"
                    onClick={() => handleInsertText(tag)}
                    title={`${descripcion} — Ejemplo: ${ejemplo}`}
                  >
                    <span className="wa-tag-label">{label}</span>
                    <span className="wa-tag-code">{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea del editor con Barra de Herramientas */}
            {loadingTemplates ? (
              <div className="text-center py-5">
                <KyriosSpinner />
                <p className="text-secondary mt-2">Cargando plantillas...</p>
              </div>
            ) : (
              <>
                <div className="wa-editor-wrapper">
                  {/* Barra rápida de Emojis y Formatos */}
                  <div className="wa-editor-toolbar">
                    <div className="wa-toolbar-group">
                      <span className="wa-toolbar-label">Emojis:</span>
                      {EMOJIS_RAPIDOS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="wa-emoji-btn"
                          onClick={() => handleInsertText(emoji)}
                          title={`Insertar ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="wa-toolbar-divider" />
                    <div className="wa-toolbar-group">
                      <button
                        type="button"
                        className="wa-format-btn"
                        onClick={() => handleWrapSelection('*', '*')}
                        title="Texto en Negrita (*texto*)"
                      >
                        <Bold size={13} />
                        <span>*Negrita*</span>
                      </button>
                      <button
                        type="button"
                        className="wa-format-btn"
                        onClick={() => handleWrapSelection('_', '_')}
                        title="Texto en Cursiva (_texto_)"
                      >
                        <Italic size={13} />
                        <span>_Cursiva_</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="wa-template-textarea"
                    rows={9}
                    value={
                      subTab === 'confirmacion'
                        ? plantillaConfirmacion
                        : plantillaRecordatorio
                    }
                    onChange={(e) => {
                      if (subTab === 'confirmacion') {
                        setPlantillaConfirmacion(e.target.value);
                      } else {
                        setPlantillaRecordatorio(e.target.value);
                      }
                    }}
                    placeholder="Escribe la plantilla del mensaje..."
                  />
                </div>

                {/* Checklist Inteligente de Datos Presentes */}
                {(() => {
                  const textoActual =
                    subTab === 'confirmacion'
                      ? plantillaConfirmacion
                      : plantillaRecordatorio;
                  const tieneCliente = textoActual.includes('{cliente}');
                  const tieneFecha = textoActual.includes('{fecha}');
                  const tieneHora = textoActual.includes('{hora}');
                  const tieneServicio = textoActual.includes('{servicio}');
                  const tieneBarbero = textoActual.includes('{barbero}');
                  const tieneUbicacion = textoActual.includes('{ubicacion}');

                  return (
                    <div className="wa-checklist-section">
                      <div className="wa-checklist-bar">
                        <span className="wa-checklist-title">Datos incluidos:</span>
                        <div className="wa-checklist-items">
                          <span
                            className={`wa-check-chip ${
                              tieneCliente ? 'active' : 'missing'
                            }`}
                          >
                            {tieneCliente ? '✓' : '✗'} Cliente
                          </span>
                          <span
                            className={`wa-check-chip ${
                              tieneFecha ? 'active' : 'missing'
                            }`}
                          >
                            {tieneFecha ? '✓' : '✗'} Fecha
                          </span>
                          <span
                            className={`wa-check-chip ${
                              tieneHora ? 'active' : 'missing'
                            }`}
                          >
                            {tieneHora ? '✓' : '✗'} Hora
                          </span>
                          <span
                            className={`wa-check-chip ${
                              tieneServicio ? 'active' : 'missing'
                            }`}
                          >
                            {tieneServicio ? '✓' : '✗'} Servicio
                          </span>
                          <span
                            className={`wa-check-chip ${
                              tieneBarbero ? 'active' : 'missing'
                            }`}
                          >
                            {tieneBarbero ? '✓' : '✗'} Barbero
                          </span>
                          <span
                            className={`wa-check-chip ${
                              tieneUbicacion ? 'active' : 'missing'
                            }`}
                          >
                            {tieneUbicacion ? '✓' : '✗'} Ubicación
                          </span>
                        </div>
                      </div>

                      {(!tieneCliente || !tieneHora) && (
                        <div className="wa-warning-tip">
                          <Lightbulb size={14} className="flex-shrink-0 text-warning" />
                          <span>
                            <strong>Recomendación:</strong> Es muy aconsejable incluir{' '}
                            <code>{'{cliente}'}</code> y <code>{'{hora}'}</code> para que
                            el cliente sepa a qué hora debe llegar a su cita.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="wa-editor-actions">
                  <button
                    type="button"
                    className="wa-btn-reset"
                    onClick={handleResetPlantillas}
                    disabled={isSavingTemplates}
                  >
                    <RotateCcw size={15} />
                    <span>Restablecer por Defecto</span>
                  </button>

                  <button
                    type="button"
                    className="wa-btn-save"
                    onClick={handleGuardarPlantillas}
                    disabled={isSavingTemplates}
                  >
                    {isSavingTemplates ? (
                      <>
                        <KyriosSpinner />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Panel Derecho: Vista Previa en Vivo (Simulador WhatsApp) */}
          <div className="wa-card">
            <div className="wa-card-header">
              <h3 className="wa-card-title">
                <Smartphone size={18} className="text-success" />
                Vista Previa en Vivo (WhatsApp)
              </h3>
            </div>
            <p className="small text-secondary mb-3">
              Así es exactamente como verá tu cliente el mensaje en su teléfono
              móvil:
            </p>

            <div className="wa-chat-preview-box">
              <div className="wa-bubble">
                {formatWhatsAppMarkdown(
                  subTab === 'confirmacion'
                    ? plantillaConfirmacion
                    : plantillaRecordatorio,
                )}
                <div className="wa-bubble-time">
                  <span>14:00</span>
                  <CheckCheck size={14} className="wa-bubble-ticks" />
                </div>
              </div>
            </div>

            {/* Aclaración de simulación */}
            <div className="wa-preview-footnote">
              <Info size={14} className="text-info flex-shrink-0" />
              <span>
                <strong>Simulación con datos de ejemplo:</strong> Los valores como <em>"Juan Pérez"</em>, <em>"Corte Clásico"</em> y <em>"14:00"</em> son demostrativos. Cada cliente recibirá su mensaje con sus datos auténticos.
              </span>
            </div>

            <div className="mt-3 p-3 bg-dark rounded border border-secondary border-opacity-25">
              <div className="small fw-semibold text-warning mb-1">
                💡 Consejos de Formato en WhatsApp:
              </div>
              <ul className="small text-secondary ps-3 mb-0">
                <li>
                  Coloca asteriscos para <strong>*negrita*</strong> (ej:{' '}
                  <code>*texto*</code>).
                </li>
                <li>
                  Coloca guiones bajos para <em>_cursiva_</em> (ej:{' '}
                  <code>_texto_</code>).
                </li>
                <li>Puedes usar emojis libremente en cualquier parte del texto.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConfigPage;

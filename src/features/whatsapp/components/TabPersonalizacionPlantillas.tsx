import React from 'react';
import {
  FileEdit,
  Send,
  Clock,
  Sparkles,
  Lightbulb,
  Tag,
  Bold,
  Italic,
  RotateCcw,
  Save,
  Smartphone,
  CheckCheck,
  Info,
} from 'lucide-react';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import {
  PRESETS,
  VARIABLES_DISPONIBLES,
  EMOJIS_RAPIDOS,
  PRESETS_ANTICIPACION,
  formatoHorasMinutos,
  getEjemploEnvio,
} from '../pages/WhatsAppConfigPage';

export interface TabPersonalizacionPlantillasProps {
  subTab: 'confirmacion' | 'recordatorio';
  setSubTab: (tab: 'confirmacion' | 'recordatorio') => void;
  minutosAnticipacion: number;
  setMinutosAnticipacion: (minutos: number) => void;
  modoPersonalizado: boolean;
  setModoPersonalizado: (val: boolean) => void;
  plantillaConfirmacion: string;
  setPlantillaConfirmacion: React.Dispatch<React.SetStateAction<string>>;
  plantillaRecordatorio: string;
  setPlantillaRecordatorio: React.Dispatch<React.SetStateAction<string>>;
  loadingTemplates: boolean;
  isSavingTemplates: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsertText: (text: string) => void;
  onWrapSelection: (prefix: string, suffix: string) => void;
  onApplyPreset: (texto: string, nombre: string) => void;
  onResetPlantillas: () => void;
  onGuardarPlantillas: () => void;
  formatWhatsAppMarkdown: (content: string) => React.ReactNode;
}

interface AnticipacionConfigProps {
  minutosAnticipacion: number;
  setMinutosAnticipacion: (minutos: number) => void;
  modoPersonalizado: boolean;
  setModoPersonalizado: (val: boolean) => void;
}

const AnticipacionConfigCard: React.FC<AnticipacionConfigProps> = ({
  minutosAnticipacion,
  setMinutosAnticipacion,
  modoPersonalizado,
  setModoPersonalizado,
}) => {
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(val) && val >= 15 && val <= 720) {
      setMinutosAnticipacion(val);
    } else if (e.target.value === '') {
      setMinutosAnticipacion(15);
    }
  };

  return (
    <div className="wa-anticipacion-card">
      <div className="wa-anticipacion-header">
        <div className="wa-anticipacion-title">
          <Clock size={16} className="text-warning" />
          <span>¿Con cuánto tiempo de anticipación enviar el recordatorio?</span>
        </div>
        <span className="wa-anticipacion-badge">
          Actualmente: {formatoHorasMinutos(minutosAnticipacion)} antes
        </span>
      </div>

      <div className="wa-anticipacion-pills">
        {PRESETS_ANTICIPACION.map((preset) => {
          const isSelected = !modoPersonalizado && minutosAnticipacion === preset.minutos;
          return (
            <button
              key={preset.minutos}
              type="button"
              className={`wa-anticipacion-pill ${isSelected ? 'active' : ''}`}
              onClick={() => {
                setModoPersonalizado(false);
                setMinutosAnticipacion(preset.minutos);
              }}
            >
              <span className="wa-pill-icon">{preset.icono}</span>
              <span>{preset.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`wa-anticipacion-pill ${modoPersonalizado ? 'active' : ''}`}
          onClick={() => setModoPersonalizado(true)}
        >
          <span className="wa-pill-icon">⚙️</span>
          <span>Personalizado</span>
        </button>
      </div>

      {modoPersonalizado && (
        <div className="wa-anticipacion-custom-box">
          <label htmlFor="custom-minutos-input" className="wa-custom-label">
            Ingresa los minutos de anticipación deseados:
          </label>
          <div className="wa-custom-input-group">
            <input
              id="custom-minutos-input"
              type="number"
              min={15}
              max={720}
              step={15}
              className="wa-custom-input"
              value={minutosAnticipacion}
              onChange={handleCustomChange}
            />
            <span className="wa-custom-unit">
              minutos ({formatoHorasMinutos(minutosAnticipacion)})
            </span>
          </div>
          <span className="wa-custom-hint">
            Rango permitido: 15 minutos a 720 minutos (12 horas).
          </span>
        </div>
      )}

      <div className="wa-anticipacion-example">
        <Lightbulb size={16} className="text-warning flex-shrink-0" />
        <span>{getEjemploEnvio(minutosAnticipacion)}</span>
      </div>
    </div>
  );
};

interface EditorTextareaSectionProps {
  loadingTemplates: boolean;
  isSavingTemplates: boolean;
  textoActual: string;
  subTab: 'confirmacion' | 'recordatorio';
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setPlantillaConfirmacion: React.Dispatch<React.SetStateAction<string>>;
  setPlantillaRecordatorio: React.Dispatch<React.SetStateAction<string>>;
  onInsertText: (text: string) => void;
  onWrapSelection: (prefix: string, suffix: string) => void;
  onResetPlantillas: () => void;
  onGuardarPlantillas: () => void;
}

const EditorTextareaSection: React.FC<EditorTextareaSectionProps> = ({
  loadingTemplates,
  isSavingTemplates,
  textoActual,
  subTab,
  textareaRef,
  setPlantillaConfirmacion,
  setPlantillaRecordatorio,
  onInsertText,
  onWrapSelection,
  onResetPlantillas,
  onGuardarPlantillas,
}) => {
  if (loadingTemplates) {
    return (
      <div className="text-center py-5">
        <KyriosSpinner />
        <p className="text-secondary mt-2">Cargando plantillas...</p>
      </div>
    );
  }

  const tieneCliente = textoActual.includes('{cliente}');
  const tieneFecha = textoActual.includes('{fecha}');
  const tieneHora = textoActual.includes('{hora}');
  const tieneServicio = textoActual.includes('{servicio}');
  const tieneBarbero = textoActual.includes('{barbero}');
  const tieneUbicacion = textoActual.includes('{ubicacion}');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (subTab === 'confirmacion') {
      setPlantillaConfirmacion(e.target.value);
    } else {
      setPlantillaRecordatorio(e.target.value);
    }
  };

  return (
    <>
      <div className="wa-editor-wrapper">
        <div className="wa-editor-toolbar">
          <div className="wa-toolbar-group">
            <span className="wa-toolbar-label">Emojis:</span>
            {EMOJIS_RAPIDOS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="wa-emoji-btn"
                onClick={() => onInsertText(emoji)}
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
              onClick={() => onWrapSelection('*', '*')}
              title="Texto en Negrita (*texto*)"
            >
              <Bold size={13} />
              <span>*Negrita*</span>
            </button>
            <button
              type="button"
              className="wa-format-btn"
              onClick={() => onWrapSelection('_', '_')}
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
          value={textoActual}
          onChange={handleTextChange}
          placeholder="Escribe la plantilla del mensaje..."
        />
      </div>

      <div className="wa-checklist-section">
        <div className="wa-checklist-bar">
          <span className="wa-checklist-title">Datos incluidos:</span>
          <div className="wa-checklist-items">
            <span className={`wa-check-chip ${tieneCliente ? 'active' : 'missing'}`}>
              {tieneCliente ? '✓' : '✗'} Cliente
            </span>
            <span className={`wa-check-chip ${tieneFecha ? 'active' : 'missing'}`}>
              {tieneFecha ? '✓' : '✗'} Fecha
            </span>
            <span className={`wa-check-chip ${tieneHora ? 'active' : 'missing'}`}>
              {tieneHora ? '✓' : '✗'} Hora
            </span>
            <span className={`wa-check-chip ${tieneServicio ? 'active' : 'missing'}`}>
              {tieneServicio ? '✓' : '✗'} Servicio
            </span>
            <span className={`wa-check-chip ${tieneBarbero ? 'active' : 'missing'}`}>
              {tieneBarbero ? '✓' : '✗'} Barbero
            </span>
            <span className={`wa-check-chip ${tieneUbicacion ? 'active' : 'missing'}`}>
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

      <div className="wa-editor-actions">
        <button
          type="button"
          className="wa-btn-reset"
          onClick={onResetPlantillas}
          disabled={isSavingTemplates}
        >
          <RotateCcw size={15} />
          <span>Restablecer por Defecto</span>
        </button>

        <button
          type="button"
          className="wa-btn-save"
          onClick={onGuardarPlantillas}
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
  );
};

interface LivePreviewCardProps {
  textoActual: string;
  formatWhatsAppMarkdown: (content: string) => React.ReactNode;
}

const LivePreviewCard: React.FC<LivePreviewCardProps> = ({
  textoActual,
  formatWhatsAppMarkdown,
}) => {
  return (
    <div className="wa-card">
      <div className="wa-card-header">
        <h3 className="wa-card-title">
          <Smartphone size={18} className="text-success" />
          Vista Previa en Vivo (WhatsApp)
        </h3>
      </div>
      <p className="small text-secondary mb-3">
        Así es exactamente como verá tu cliente el mensaje en su teléfono móvil:
      </p>

      <div className="wa-chat-preview-box">
        <div className="wa-bubble">
          {formatWhatsAppMarkdown(textoActual)}
          <div className="wa-bubble-time">
            <span>14:00</span>
            <CheckCheck size={14} className="wa-bubble-ticks" />
          </div>
        </div>
      </div>

      <div className="wa-preview-footnote">
        <Info size={14} className="text-info flex-shrink-0" />
        <span>
          <strong>Simulación con datos de ejemplo:</strong> Los valores como <em>"Juan Pérez"</em>, <em>"Corte Clásico"</em> y <em>"14:00"</em> son demostrativos. Cada cliente recibirá su mensaje con sus datos auténticos.
        </span>
      </div>

      <div className="wa-format-tips-box">
        <div className="wa-format-tips-title">
          💡 Consejos de Formato en WhatsApp:
        </div>
        <ul className="wa-format-tips-list">
          <li>
            Coloca asteriscos para <strong>*negrita*</strong> (ej: <code>*texto*</code>).
          </li>
          <li>
            Coloca guiones bajos para <em>_cursiva_</em> (ej: <code>_texto_</code>).
          </li>
          <li>Puedes usar emojis libremente en cualquier parte del texto.</li>
        </ul>
      </div>
    </div>
  );
};

const ContextBanner: React.FC<{ subTab: 'confirmacion' | 'recordatorio'; minutosAnticipacion: number }> = ({
  subTab,
  minutosAnticipacion,
}) => {
  const isConfirmacion = subTab === 'confirmacion';
  const tiempoFormateado = formatoHorasMinutos(minutosAnticipacion);
  return (
    <div className="wa-context-banner">
      <div className="wa-context-badge">
        {isConfirmacion ? (
          <>
            <Sparkles size={14} className="text-warning" />
            <span>Disparo Inmediato al Reservar</span>
          </>
        ) : (
          <>
            <Clock size={14} className="text-info" />
            <span>Disparo Automático ({tiempoFormateado} Antes)</span>
          </>
        )}
      </div>
      <p className="wa-context-desc">
        {isConfirmacion
          ? 'Este mensaje se envía de forma automática a WhatsApp tan pronto el cliente confirma su cita en la página web.'
          : `El sistema revisa las citas del día cada 10 minutos y envía este recordatorio a los clientes que tengan cita en las próximas ${tiempoFormateado}.`}
      </p>
    </div>
  );
};

export const TabPersonalizacionPlantillas: React.FC<TabPersonalizacionPlantillasProps> = ({
  subTab,
  setSubTab,
  minutosAnticipacion,
  setMinutosAnticipacion,
  modoPersonalizado,
  setModoPersonalizado,
  plantillaConfirmacion,
  setPlantillaConfirmacion,
  plantillaRecordatorio,
  setPlantillaRecordatorio,
  loadingTemplates,
  isSavingTemplates,
  textareaRef,
  onInsertText,
  onWrapSelection,
  onApplyPreset,
  onResetPlantillas,
  onGuardarPlantillas,
  formatWhatsAppMarkdown,
}) => {
  const textoActual = subTab === 'confirmacion' ? plantillaConfirmacion : plantillaRecordatorio;

  return (
    <div className="wa-grid">
      <div className="wa-card">
        <div className="wa-card-header">
          <h3 className="wa-card-title">
            <FileEdit size={18} className="text-success" />
            Editor de Plantillas de Mensajes
          </h3>
        </div>

        <div className="wa-subtabs">
          <button
            type="button"
            className={`wa-subtab-btn ${subTab === 'confirmacion' ? 'active' : ''}`}
            onClick={() => setSubTab('confirmacion')}
          >
            <Send size={15} />
            <span>Mensaje de Confirmación</span>
          </button>

          <button
            type="button"
            className={`wa-subtab-btn ${subTab === 'recordatorio' ? 'active' : ''}`}
            onClick={() => setSubTab('recordatorio')}
          >
            <Clock size={15} />
            <span>Mensaje de Recordatorio ({formatoHorasMinutos(minutosAnticipacion)})</span>
          </button>
        </div>

        <ContextBanner subTab={subTab} minutosAnticipacion={minutosAnticipacion} />

        {subTab === 'recordatorio' && (
          <AnticipacionConfigCard
            minutosAnticipacion={minutosAnticipacion}
            setMinutosAnticipacion={setMinutosAnticipacion}
            modoPersonalizado={modoPersonalizado}
            setModoPersonalizado={setModoPersonalizado}
          />
        )}

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
                onClick={() => onApplyPreset(preset.texto, preset.nombre)}
                title={`Cargar estilo "${preset.nombre}"`}
              >
                <span>{preset.icono}</span>
                <span>{preset.nombre}</span>
              </button>
            ))}
          </div>
        </div>

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
                onClick={() => onInsertText(tag)}
                title={`${descripcion} — Ejemplo: ${ejemplo}`}
              >
                <span className="wa-tag-label">{label}</span>
                <span className="wa-tag-code">{tag}</span>
              </button>
            ))}
          </div>
        </div>

        <EditorTextareaSection
          loadingTemplates={loadingTemplates}
          isSavingTemplates={isSavingTemplates}
          textoActual={textoActual}
          subTab={subTab}
          textareaRef={textareaRef}
          setPlantillaConfirmacion={setPlantillaConfirmacion}
          setPlantillaRecordatorio={setPlantillaRecordatorio}
          onInsertText={onInsertText}
          onWrapSelection={onWrapSelection}
          onResetPlantillas={onResetPlantillas}
          onGuardarPlantillas={onGuardarPlantillas}
        />
      </div>

      <LivePreviewCard
        textoActual={textoActual}
        formatWhatsAppMarkdown={formatWhatsAppMarkdown}
      />
    </div>
  );
};


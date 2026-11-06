import React, { useRef, useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import type { BarberoGestion } from '../types/barberos.types';

interface FotoBarberoModalProps {
  isOpen: boolean;
  barbero: BarberoGestion | null;
  onClose: () => void;
  onSubmit: (barberoId: number, file: File) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Subcomponente de preview circular con fallback a iniciales.
 * Se monta con key={src} para resetear el estado de error sin useEffect.
 */
const BarberoPreviewImg: React.FC<{
  src: string;
  iniciales: string;
}> = ({ src, iniciales }) => {
  const [errorImagen, setErrorImagen] = useState(false);

  if (!errorImagen) {
    return (
      <img
        src={src}
        alt="Vista previa"
        onError={() => setErrorImagen(true)}
        className="rounded-circle border"
        style={{ width: '110px', height: '110px', objectFit: 'cover' }}
      />
    );
  }

  /* Fallback: iniciales adaptadas al tema visual del tenant */
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center border"
      style={{
        width: '110px',
        height: '110px',
        backgroundColor: 'var(--tenant-accent, #0071BC)',
        color: 'var(--tenant-btn-text, #ffffff)',
      }}
    >
      <span className="fw-bold" style={{ fontSize: '2rem' }}>
        {iniciales}
      </span>
    </div>
  );
};

export const FotoBarberoModal: React.FC<FotoBarberoModalProps> = ({
  isOpen,
  barbero,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState('');

  const handleSeleccionar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorLocal('');
    if (file.size > 5 * 1024 * 1024) {
      setErrorLocal('La imagen supera el límite permitido de 5 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setErrorLocal('Formato no válido. Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }
    setArchivoSeleccionado(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleModalClose = () => {
    setArchivoSeleccionado(null);
    setPreviewUrl(null);
    setErrorLocal('');
    onClose();
  };

  const handleGuardar = async () => {
    if (!barbero || !archivoSeleccionado) return;

    if (barbero.fotoUrl) {
      const ok = await confirm({
        title: '¿Reemplazar foto actual?',
        message: `¿Deseas reemplazar la foto actual de ${barbero.nombre} ${barbero.apellido}?`,
        variant: 'warning',
        confirmLabel: 'Reemplazar',
      });
      if (!ok) return;
    }

    await onSubmit(barbero.id, archivoSeleccionado);
    handleModalClose();
  };

  if (!isOpen || !barbero) return null;

  const fotoActual = obtenerUrlFoto(barbero.fotoUrl);
  const fuenteImagen = previewUrl || fotoActual;
  const iniciales = `${barbero.nombre.charAt(0)}${barbero.apellido.charAt(0)}`.toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={`Foto de ${barbero.nombre} ${barbero.apellido}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleModalClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGuardar}
            isLoading={isLoading}
            loadingText="Subiendo..."
            disabled={!archivoSeleccionado}
          >
            Guardar Foto
          </Button>
        </>
      }
    >
      {(error || errorLocal) && (
        <div className="alert alert-danger mb-3">{error || errorLocal}</div>
      )}

      <div className="text-center mb-3">
        {/* Contenedor fijo: evita salto de layout si la imagen falla */}
        <div className="d-inline-block" style={{ width: '110px', height: '110px' }}>
          {fuenteImagen ? (
            /* key={fuenteImagen}: remonta BarberoPreviewImg cuando cambia la fuente */
            <BarberoPreviewImg key={fuenteImagen} src={fuenteImagen} iniciales={iniciales} />
          ) : (
            /* Sin imagen: iniciales directamente */
            <div
              className="rounded-circle d-flex align-items-center justify-content-center border"
              style={{
                width: '110px',
                height: '110px',
                backgroundColor: 'var(--tenant-accent, #0071BC)',
                color: 'var(--tenant-btn-text, #ffffff)',
              }}
            >
              <span className="fw-bold" style={{ fontSize: '2rem' }}>
                {iniciales}
              </span>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleSeleccionar}
        style={{ display: 'none' }}
      />
      <div className="d-flex justify-content-center">
        <Button type="button" variant="outline-primary" size="sm" onClick={() => fileInputRef.current?.click()}>
          Seleccionar Imagen
        </Button>
      </div>
      <div className="text-muted text-center mt-2" style={{ fontSize: '0.75rem' }}>
        Formatos: JPG, PNG o WEBP. Máx. 5 MB.
      </div>
    </Modal>
  );
};

export default FotoBarberoModal;
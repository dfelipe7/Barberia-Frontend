import React, { useRef, useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import type { BarberoGestion } from '../types/barberos.types';

interface FotoBarberoModalProps {
  isOpen: boolean;
  barbero: BarberoGestion | null;
  onClose: () => void;
  onSubmit: (barberoId: number, file: File) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const FotoBarberoModal: React.FC<FotoBarberoModalProps> = ({
  isOpen,
  barbero,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
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
    await onSubmit(barbero.id, archivoSeleccionado);
    handleModalClose();
  };

  if (!isOpen || !barbero) return null;

  const fotoActual = obtenerUrlFoto(barbero.fotoUrl);

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
        {previewUrl || fotoActual ? (
          <img
            src={previewUrl || fotoActual!}
            alt="Vista previa"
            className="rounded-circle border"
            style={{ width: '110px', height: '110px', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="rounded-circle bg-surface-app d-flex align-items-center justify-content-center mx-auto border"
            style={{ width: '110px', height: '110px' }}
          >
            <span className="text-surface-muted fw-bold" style={{ fontSize: '2rem' }}>
              {barbero.nombre.charAt(0)}{barbero.apellido.charAt(0)}
            </span>
          </div>
        )}
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
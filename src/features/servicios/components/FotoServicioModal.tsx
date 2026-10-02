import React, { useState } from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import FileUploadField from '../../../shared/ui/molecules/FileUploadField';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useSubirFotoServicio, useEliminarFotoServicio } from '../api/servicios.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import type { Servicio } from '../types/servicios.types';

interface FotoServicioModalProps {
  servicio: Servicio | null;
  onClose: () => void;
  onSuccess?: (mensaje: string) => void;
}

export const FotoServicioModal: React.FC<FotoServicioModalProps> = ({ servicio, onClose, onSuccess }) => {
  const subirMutation = useSubirFotoServicio();
  const eliminarMutation = useEliminarFotoServicio();
  const [error, setError] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);

  if (!servicio) return null;

  const handleSeleccionar = (file: File) => {
    setArchivoSeleccionado(file);
    setPreviewLocal(URL.createObjectURL(file));
  };

  const handleGuardar = async () => {
    if (!archivoSeleccionado) return;
    try {
      setError(null);
      await subirMutation.mutateAsync({ id: servicio.id, file: archivoSeleccionado });
      onSuccess?.('Foto del servicio actualizada correctamente.');
      onClose();
    } catch (err: unknown) {
      setError(mapApiError(err));
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Eliminar la foto de este servicio?')) return;
    try {
      setError(null);
      await eliminarMutation.mutateAsync(servicio.id);
      onSuccess?.('Foto del servicio eliminada correctamente.');
      onClose();
    } catch (err: unknown) {
      setError(mapApiError(err));
    }
  };

  return (
    <Modal
      isOpen={Boolean(servicio)}
      onClose={onClose}
      title={`Foto de ${servicio.nombre}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {archivoSeleccionado && (
            <Button variant="primary" onClick={handleGuardar} isLoading={subirMutation.isPending}>
              Guardar Foto
            </Button>
          )}
        </>
      }
    >
      <FileUploadField
        previewUrl={previewLocal || obtenerUrlFoto(servicio.fotoUrl)}
        placeholderTexto={servicio.nombre}
        onFileSelected={handleSeleccionar}
        onRemove={obtenerUrlFoto(servicio.fotoUrl) ? handleEliminar : undefined}
        isUploading={subirMutation.isPending}
        isRemoving={eliminarMutation.isPending}
        error={error}
      />
    </Modal>
  );
};

export default FotoServicioModal;

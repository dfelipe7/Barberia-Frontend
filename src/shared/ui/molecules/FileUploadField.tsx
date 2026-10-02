import React, { useRef } from 'react';
import Button from '../Button';

interface FileUploadFieldProps {
  previewUrl?: string | null;
  placeholderTexto: string;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  isUploading?: boolean;
  isRemoving?: boolean;
  error?: string | null;
  shape?: 'circle' | 'square';
  size?: number;
}

const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  previewUrl,
  placeholderTexto,
  onFileSelected,
  onRemove,
  isUploading = false,
  isRemoving = false,
  error,
  shape = 'square',
  size = 130,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorLocal, setErrorLocal] = React.useState('');

  const handleSeleccionar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorLocal('');
    if (file.size > TAMANO_MAXIMO_BYTES) {
      setErrorLocal('La imagen supera el límite permitido de 5 MB.');
      return;
    }
    if (!TIPOS_VALIDOS.includes(file.type)) {
      setErrorLocal('Formato no válido. Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }
    onFileSelected(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="text-center">
      {(error || errorLocal) && (
        <div className="alert alert-danger py-2 small">{error || errorLocal}</div>
      )}
      <div className="d-inline-block position-relative mb-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={placeholderTexto}
            className={shape === 'circle' ? 'rounded-circle shadow-sm border' : 'rounded shadow-sm border'}
            style={{ width: size, height: size, objectFit: 'cover' }}
          />
        ) : (
          <div
            className={`bg-surface-app d-flex align-items-center justify-content-center mx-auto border ${
              shape === 'circle' ? 'rounded-circle' : 'rounded'
            }`}
            style={{ width: size, height: size }}
          >
            <span className="text-surface-muted small">{placeholderTexto}</span>
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
      <div className="d-flex justify-content-center gap-2">
        <Button
          type="button"
          variant="outline-primary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          isLoading={isUploading}
          loadingText="Subiendo..."
          disabled={isRemoving}
        >
          {previewUrl ? 'Cambiar' : 'Subir Foto'}
        </Button>
        {previewUrl && onRemove && (
          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            onClick={onRemove}
            isLoading={isRemoving}
            loadingText="Eliminando..."
            disabled={isUploading}
          >
            Eliminar
          </Button>
        )}
      </div>
      <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
        Formatos: JPG, PNG o WEBP. Máx. 5 MB.
      </div>
    </div>
  );
};

export default FileUploadField;
